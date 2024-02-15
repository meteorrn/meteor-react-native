import Data from '../../src/Data';
import Meteor from '../../src/Meteor'
import { expect } from 'chai'
import { awaitDisconnected, endpoint } from '../testHelpers'

describe('Data', function () {
  let data
  beforeEach(async () => {
    await awaitDisconnected()
    data = Meteor.getData()
    expect(data.ddp.status).to.equal('disconnected')
  })
  describe(Data.getUrl.name, function () {
    it('returns the endpoint url', () => {
      data._endpoint = null
      expect(() =>data.getUrl()).to.throw('Cannot read properties of null')
      data._endpoint = endpoint
      const base = data.getUrl()
      expect(base).to.equal('ws://localhost:3000')
    })
  })
  describe(Data.waitDdpReady.name, () => {
    it('immediately resolves if DDP is available', (done) => {
      data.waitDdpReady(done)
    })
    it('waits until DDP is available', (done) => {
      const ddp = data.ddp
      data.ddp = null
      data.waitDdpReady(done)

      setTimeout(() => {
        data.ddp = ddp
      }, 1000)
    })
  })
  describe(Data.waitDdpConnected.name, () => {
    it('immediately resolves if already connected', (done) => {
      const beforeDDP = data.ddp
      Meteor.connect(endpoint, { NetInfo: null, autoConnect: false })
      expect(beforeDDP).to.not.equal(data.ddp)

      data.ddp.once('connected', () => {
          done()
        data.waitDdpConnected(() => {
        })
      })

      data.ddp.connect()
    })
    it('resolves, once connected', done => {
      Meteor.connect(endpoint, { NetInfo: null, autoConnect: false })
      data.ddp.once('connected', () => {
        data.waitDdpConnected(() => {
          done()
        })
      })
    })
    it('resolves, once ddp is ready and connected')
  })
  describe(Data.onChange.name, () => {
    it('listens to various events of change and pipes them into a single callback', done => {
      /* Events:
       * - ddp: change
       * - ddp: connected
       * - ddp: disconnected
       * - Accounts: loggingIn
       * - Accounts: loggingOut
       * - DB: change
       */
      const events = []
      const checkDone = (event, data) => {
        console.debug(event, data)
        events.push(event)
        if (events.length >= 6) {
          data.offChange(checkDone)
          done()
        }
      }
      data.onChange(checkDone)
      Meteor.connect(endpoint, { NetInfo: null })
    })
  })
  describe(Data.offChange.name, () => {
    it('is not implemented')
  })
  describe(Data.on.name, () => {
    it('is not implemented')
  })
  describe(Data.off.name, () => {
    it('is not implemented')
  })
  describe(Data.notify.name, () => {
    it('is not implemented')
  })
})