window.lastObservedMutation = performance.now();
var results = [];

var worker = new Worker('./scripts/worker.js');
/*
worker.onmessage = function (e) {
  var now = performance.now();

  results = results.concat(e.data.records);
};
*/

var toSerialize = [];
var CHUNK_LIMIT = 10000;
var i = 0;
var j = 0;
function serializeChunk() {
  var now = performance.now();
  var serialized = [];
  var result, serializeStart;

  while (serialized.length < CHUNK_LIMIT && i < toSerialize.length) {
    console.log('serializing',
      CHUNK_LIMIT - serialized.length, 'of', toSerialize[i].mutations.length);
    while (serialized.length < CHUNK_LIMIT &&
      j < toSerialize[i].mutations.length
    ) {
      serializeStart = performance.now();
      result = serialize.serializeMutationRecord(toSerialize[i].mutations[j]);
      result.mutationTime = toSerialize[i].mutationTime;
      result.now = performance.now();
      result.serializeTime = result.now - serializeStart;
      serialized.push(result);
      j++;
    }

    if (j >= toSerialize[i].mutations.length) {
      i++;
      j = 0;
    }
  }

  console.log('that took', performance.now() - now, 'ms');
  worker.postMessage('');
  if (i < toSerialize.length) {
    queue.push(serializeChunk);
  }
}

var serializationTime = [];
var serializeRecordTime = [];
var postMessageTime = [];
var metrics = {
  serializeRecordTime: serializeRecordTime,
  serializationTime: serializationTime,
  postMessageTime: postMessageTime
};
var observer = new MutationObserver(function (mutations) {
  var serialized = Array(mutations.length);
  var now = performance.now();
  var now2;

  window.lastObservedMutation = now;

  var mutation;
  for (var i = 0; i < mutations.length; i++) {
    mutation = mutations[i];
    mutation.target.__treehouseChildIndex = mutation.previousSibling ?
      mutation.previousSibling.__treehouseChildIndex + 1 : 0;
    now2 = performance.now();
    serialized[i] = serialize.serializeMutationRecord(mutation);
    serializeRecordTime.push(performance.now() - now2);
  }
  toSerialize = toSerialize.concat(serialized);
  serializationTime.push(performance.now() - now);

  now = performance.now();
  worker.postMessage(serialized);
  postMessageTime.push(performance.now() - now);
});

observer.observe(document.querySelector('html'), {
  attributes: true,
  subtree: true,
  childList: true,
  characterData: false,
  attributeOldValue: false
});
var start = performance.now();
