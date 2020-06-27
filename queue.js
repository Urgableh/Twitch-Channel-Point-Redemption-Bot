var queue = require('queue');
 
var q = queue()
var results = []
 
function sayhi(str) {
    console.log(str);
}

// add jobs using the familiar Array API
q.push(function (cb) {
  results.push(sayhi('sdasd'))
  q.stop() ///////////////////////////////////////////////////
  cb()
})
 
q.push(
  function (cb) {
    results.push('four')
    cb()
  },
  function (cb) {
    results.push('five')
    cb()
  }
)
 
// jobs can accept a callback or return a promise
q.push(function () {
  return new Promise(function (resolve, reject) {
    results.push('one')
    resolve()
  })
})
 
q.unshift(function (cb) {
  results.push('one')
  cb()
})
 
q.splice(2, 0, function (cb) {
  results.push('three')
  cb()
})
 
// use the timeout feature to deal with jobs that
// take too long or forget to execute a callback
q.timeout = 100
 
q.on('timeout', function (next, job) {
  console.log('job timed out:', job.toString().replace(/\n/g, ''))
  next()
})
 
q.push(function (cb) {
  setTimeout(function () {
    console.log('slow job finished')
    cb()
  }, 200)
})
 
q.push(function (cb) {
  console.log('forgot to execute callback')
})
 
// jobs can also override the queue's timeout
// on a per-job basis
function extraSlowJob (cb) {
  setTimeout(function () {
    console.log('extra slow job finished')
    cb()
  }, 400)
}
 
extraSlowJob.timeout = 500
q.push(extraSlowJob)
 
// get notified when jobs complete
q.on('success', function (result, job) {
  console.log('job finished processing:', job.toString().replace(/\n/g, ''))
})
 
// begin processing, get notified on end / failure
q.start(function (err) {
  if (err) throw err
  console.log('all done:', results)
})