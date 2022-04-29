import Tracker from '../../src/Tracker'
import { expect } from 'chai'

const eql = (a, b, deep) => deep
  ? expect(a).to.deep.equal(b)
  : expect(a).to.equal(b);

describe('Tracker', function () {
  it('run', function () {
    const t = new Tracker.Dependency;
    let x = 0;
    const handle = Tracker.autorun(function (/* handle */) {
      t.depend();
      ++x;
    });
    expect(x).to.equal(1);

    Tracker.flush();
    expect(x).to.equal(1);

    t.changed();
    expect(x).to.equal(1);

    Tracker.flush();
    expect(x).to.equal(2);

    t.changed();
    expect(x).to.equal(2);

    Tracker.flush();
    expect(x).to.equal(3);


    t.changed();
    // Prevent the function from running further.
    handle.stop();
    Tracker.flush();
    expect(x).to.equal(3);

    t.changed();
    Tracker.flush();
    expect(x).to.equal(3);


    Tracker.autorun(function (internalHandle) {
      t.depend();
      ++x;
      if (x === 6) internalHandle.stop();
    });
    expect(x).to.equal(4);
    t.changed();
    Tracker.flush();

    expect(x).to.equal(5);
    t.changed();

    // Increment to 6 and stop.
    Tracker.flush();
    expect(x).to.equal(6);

    t.changed();
    Tracker.flush();
    // Still 6!
    expect(x).to.equal(6);

    // throw tests
    expect(() => Tracker.autorun())
      .to.throw('Tracker.autorun requires a function argument')
    expect(() => Tracker.autorun({}))
      .to.throw('Tracker.autorun requires a function argument')
  })
  it('#run',function () {
    let i = 0, d = new Tracker.Dependency, d2 = new Tracker.Dependency;
    const computation = Tracker.autorun(function (c) {
      d.depend();
      i = i + 1;
      //when #run() is called, this dependency should be picked up
      if (i>=2 && i<4) { d2.depend(); }
    });
    expect(i).to.equal(1);
    computation.run();
    expect(i).to.equal(2);

    d.changed(); Tracker.flush();
    expect(i).to.equal(3);

    //we expect to depend on d2 at this point
    d2.changed(); Tracker.flush();
    expect(i).to.equal(4);

    //we no longer depend on d2, only d
    d2.changed(); Tracker.flush();
    expect(i).to.equal(4);
    d.changed(); Tracker.flush();
    expect(i).to.equal(5);
  })
  it('nested run', function () {
    const a = new Tracker.Dependency;
    const b = new Tracker.Dependency;
    const c = new Tracker.Dependency;
    const d = new Tracker.Dependency;
    const e = new Tracker.Dependency;
    const f = new Tracker.Dependency;

    let buf = "";

    const c1 = Tracker.autorun(function () {
      a.depend();
      buf += 'a';
      Tracker.autorun(function () {
        b.depend();
        buf += 'b';
        Tracker.autorun(function () {
          c.depend();
          buf += 'c';
          const c2 = Tracker.autorun(function () {
            d.depend();
            buf += 'd';
            Tracker.autorun(function () {
              e.depend();
              buf += 'e';
              Tracker.autorun(function () {
                f.depend();
                buf += 'f';
              });
            });
            Tracker.onInvalidate(function () {
              // only run once
              c2.stop();
            });
          });
        });
      });
      Tracker.onInvalidate(function (c1) {
        c1.stop();
      });
    });

    const check = function (str) {
      expect(buf).to.equal(str);
      buf = "";
    };

    check('abcdef');

    expect(a.hasDependents()).to.equal(true);
    expect(b.hasDependents()).to.equal(true);
    expect(c.hasDependents()).to.equal(true);
    expect(d.hasDependents()).to.equal(true);
    expect(e.hasDependents()).to.equal(true);
    expect(f.hasDependents()).to.equal(true);

    b.changed();
    check(''); // didn't flush yet
    Tracker.flush();
    check('bcdef');

    c.changed();
    Tracker.flush();
    check('cdef');

    const changeAndCheck = function (v, str) {
      v.changed();
      Tracker.flush();
      check(str);
    };

    // should cause running
    changeAndCheck(e, 'ef');
    changeAndCheck(f, 'f');
    // invalidate inner context
    changeAndCheck(d, '');
    // no more running!
    changeAndCheck(e, '');
    changeAndCheck(f, '');

    expect(a.hasDependents()).to.equal(true);
    expect(b.hasDependents()).to.equal(true);
    expect(c.hasDependents()).to.equal(true);
    expect(d.hasDependents()).to.equal(false);
    expect(e.hasDependents()).to.equal(false);
    expect(f.hasDependents()).to.equal(false);

    // rerun C
    changeAndCheck(c, 'cdef');
    changeAndCheck(e, 'ef');
    changeAndCheck(f, 'f');
    // rerun B
    changeAndCheck(b, 'bcdef');
    changeAndCheck(e, 'ef');
    changeAndCheck(f, 'f');

    expect(a.hasDependents()).to.equal(true);
    expect(b.hasDependents()).to.equal(true);
    expect(c.hasDependents()).to.equal(true);
    expect(d.hasDependents()).to.equal(true);
    expect(e.hasDependents()).to.equal(true);
    expect(f.hasDependents()).to.equal(true);

    // kill A
    a.changed();
    changeAndCheck(f, '');
    changeAndCheck(e, '');
    changeAndCheck(d, '');
    changeAndCheck(c, '');
    changeAndCheck(b, '');
    changeAndCheck(a, '');

    expect(a.hasDependents()).to.equal(false);
    expect(b.hasDependents()).to.equal(false);
    expect(c.hasDependents()).to.equal(false);
    expect(d.hasDependents()).to.equal(false);
    expect(e.hasDependents()).to.equal(false);
    expect(f.hasDependents()).to.equal(false);
  });
  it('flush', function () {
    let buf = "";

    const c1 = Tracker.autorun(function (c) {
      buf += 'a';
      // invalidate first time
      if (c.firstRun) c.invalidate();
    });

    eql(buf, 'a');
    Tracker.flush();
    eql(buf, 'aa');
    Tracker.flush();
    eql(buf, 'aa');
    c1.stop();
    Tracker.flush();
    eql(buf, 'aa');

    //////

    buf = "";

    const c2 = Tracker.autorun(function (c) {
      buf += 'a';
      // invalidate first time
      if (c.firstRun)
        c.invalidate();

      Tracker.onInvalidate(function () {
        buf += "*";
      });
    });

    eql(buf, 'a*');
    Tracker.flush();
    eql(buf, 'a*a');
    c2.stop();
    eql(buf, 'a*a*');
    Tracker.flush();
    eql(buf, 'a*a*');

    /////
    // Can flush a different run from a run;
    // no current computation in afterFlush

    buf = "";

    const c3 = Tracker.autorun(function (c) {
      buf += 'a';
      // invalidate first time
      if (c.firstRun)
        c.invalidate();
      Tracker.afterFlush(function () {
        buf += (Tracker.active ? "1" : "0");
      });
    });

    Tracker.afterFlush(function () {
      buf += 'c';
    });

    let c4 = Tracker.autorun(function (c) {
      c4 = c;
      buf += 'b';
    });

    Tracker.flush();
    eql(buf, 'aba0c0');
    c3.stop();
    c4.stop();
    Tracker.flush();

    // cases where flush throws

    let ran = false;
    Tracker.afterFlush(function (arg) {
      ran = true;
      eql(typeof arg, 'undefined');
      expect(() => {
        Tracker.flush();
      }).to.throw('Can\'t call Tracker.flush while flushing');
    });

    Tracker.flush();
    expect(ran).to.equal(true);

    expect(() => {
      Tracker.autorun(function () {
        Tracker.flush();
      });
    }).to.throw('Can\'t flush inside Tracker.autorun');

    expect(() => {
      Tracker.autorun(function () {
        Tracker.autorun(function () {});
        Tracker.flush();
      });
    }).to.throw('Can\'t flush inside Tracker.autorun');
  });
  it('#flush', function () {
    let i = 0, j = 0, d = new Tracker.Dependency;
    const c1 = Tracker.autorun(function () {
      d.depend();
      i = i + 1;
    });
    const c2 = Tracker.autorun(function () {
      d.depend();
      j = j + 1;
    });
    eql(i,1);
    eql(j,1);

    d.changed();
    c1.flush();
    eql(i, 2);
    eql(j, 1);

    Tracker.flush();
    eql(i, 2);
    eql(j, 2);
  })
  it('lifecycle', function () {
    expect(Tracker.active).to.equal(false);
    eql(null, Tracker.currentComputation);

    let runCount = 0;
    let firstRun = true;
    const buf = [];
    let cbId = 1;
    const makeCb = function () {
      let id = cbId++;
      return function () {
        buf.push(id);
      };
    };

    let shouldStop = false;

    const c1 = Tracker.autorun(function (c) {
      expect(Tracker.active).to.equal(true);
      eql(c, Tracker.currentComputation);
      eql(c.stopped, false);
      eql(c.invalidated, false);
      eql(c.firstRun, firstRun);

      Tracker.onInvalidate(makeCb()); // 1, 6, ...
      Tracker.afterFlush(makeCb()); // 2, 7, ...

      Tracker.autorun(function (x) {
        x.stop();
        c.onInvalidate(makeCb()); // 3, 8, ...

        Tracker.onInvalidate(makeCb()); // 4, 9, ...
        Tracker.afterFlush(makeCb()); // 5, 10, ...
      });
      runCount++;

      if (shouldStop)
        c.stop();
    });

    firstRun = false;

    eql(runCount, 1);

    eql(buf, [4], true);
    c1.invalidate();
    eql(runCount, 1);
    eql(c1.invalidated, true);
    eql(c1.stopped, false);
    eql(buf, [4, 1, 3], true);

    Tracker.flush();

    eql(runCount, 2);
    eql(c1.invalidated, false);
    eql(buf, [4, 1, 3, 9, 2, 5, 7, 10], true);

    // test self-stop
    buf.length = 0;
    shouldStop = true;
    c1.invalidate();
    eql(buf, [6, 8], true);
    Tracker.flush();
    eql(buf, [6, 8, 14, 11, 13, 12, 15], true);

  });
  it('onInvalidate', function () {
    let buf = "";

    const c1 = Tracker.autorun(function () {
      buf += "*";
    });

    const append = function (x, expectedComputation) {
      return function (givenComputation) {
        expect(Tracker.active).to.equal(false);
        eql(givenComputation, expectedComputation || c1);
        buf += x;
      };
    };

    c1.onStop(append('s'));

    c1.onInvalidate(append('a'));
    c1.onInvalidate(append('b'));
    eql(buf, '*');
    Tracker.autorun(function (me) {
      Tracker.onInvalidate(append('z', me));
      me.stop();
      eql(buf, '*z');
      c1.invalidate();
    });
    eql(buf, '*zab');
    c1.onInvalidate(append('c'));
    c1.onInvalidate(append('d'));
    eql(buf, '*zabcd');
    Tracker.flush();
    eql(buf, '*zabcd*');

    // afterFlush ordering
    buf = '';
    c1.onInvalidate(append('a'));
    c1.onInvalidate(append('b'));
    Tracker.afterFlush(function () {
      append('x')(c1);
      c1.onInvalidate(append('c'));
      c1.invalidate();
      Tracker.afterFlush(function () {
        append('y')(c1);
        c1.onInvalidate(append('d'));
        c1.invalidate();
      });
    });
    Tracker.afterFlush(function () {
      append('z')(c1);
      c1.onInvalidate(append('e'));
      c1.invalidate();
    });

    eql(buf, '');
    Tracker.flush();
    eql(buf, 'xabc*ze*yd*');

    buf = "";
    c1.onInvalidate(append('m'));
    Tracker.flush();
    eql(buf, '');
    c1.stop();
    eql(buf, 'ms');  // s is from onStop
    Tracker.flush();
    eql(buf, 'ms');
    c1.onStop(append('S'));
    eql(buf, 'msS');
  });
  it('invalidate at flush time', function () {
    // Test this sentence of the docs: Functions are guaranteed to be
    // called at a time when there are no invalidated computations that
    // need rerunning.

    const buf = [];

    Tracker.afterFlush(function () {
      buf.push('C');
    });

    // When c1 is invalidated, it invalidates c2, then stops.
    const c1 = Tracker.autorun(function (c) {
      if (! c.firstRun) {
        buf.push('A');
        c2.invalidate();
        c.stop();
      }
    });

    const c2 = Tracker.autorun(function (c) {
      if (! c.firstRun) {
        buf.push('B');
        c.stop();
      }
    });

    // Invalidate c1.  If all goes well, the re-running of
    // c2 should happen before the afterFlush.
    c1.invalidate();
    Tracker.flush();

    eql(buf.join(''), 'ABC', true);
  });
  it('throwFirstError', function () {
    const d = new Tracker.Dependency;
    Tracker.autorun(function (c) {
      d.depend();

      if (!c.firstRun) throw new Error("expected error foo");
    });

    d.changed();
    // doesn't throw; logs instead.
    Tracker.flush();

    d.changed();
    expect(() => {
      Tracker.flush({_throwFirstError: true});
    }).to.throw(/expected error foo/);
  });
  it('no infinite recomputation - async', function (done) {
    let reran = false;
    const c = Tracker.autorun(function (c) {
      if (! c.firstRun) reran = true;
      c.invalidate();
    });
    expect(reran).to.equal(false);
    setTimeout(function () {
      c.stop();
      Tracker.afterFlush(function () {
        expect(reran).to.equal(true);
        expect(c.stopped).to.equal(true);
        done();
      });
    }, 100);
  });
  it('Tracker.flush finishes', function () {
    // Currently, _runFlush will "yield" every 1000 computations... unless run in
    // Tracker.flush. So this test validates that Tracker.flush is capable of
    // running 2000 computations. Which isn't quite the same as infinity, but it's
    // getting there.
    let n = 0;
    const c = Tracker.autorun(function (c) {
      if (++n < 2000) {
        c.invalidate();
      }
    });
    eql(n, 1);
    Tracker.flush();
    eql(n, 2000);
  });
  it('Tracker.autorun, onError option - async', function (done) {
    const d = new Tracker.Dependency;
    const c = Tracker.autorun(function (c) {
      d.depend();

      if (! c.firstRun) throw new Error("expected error foo");
    }, {
      onError: function (err) {
        eql(err.message, "expected error foo")
        done()
      }
    });

    d.changed();
    Tracker.flush();
  });

})