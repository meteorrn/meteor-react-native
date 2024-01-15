/**
 * The internal message queue for the DDP protocol.
 */
export default class Queue {
  /**
   * As the name implies, `Consumer` is the (sole) consumer of the queue.
   *
   * It gets called with each element of the queue and its return value
   * serves as a ack, determining whether the element is removed or not from
   * the queue, allowing then subsequent elements to be processed.
   *
   * @constructor
   * @param {function} consumer function to be called when the next element in the queue is to be processed
   */
  constructor(consumer) {
    this.consumer = consumer;
    this.queue = [];
  }

  /**
   * Adds a new element to the queue
   * @param element {any} likely an object
   */
  push(element) {
    this.queue.push(element);
    this.process();
  }

  /**
   * Sync; processes the queue by each element, starting with the first
   * and passing each to the consumer.
   */
  process() {
    if (this.queue.length !== 0) {
      const ack = this.consumer(this.queue[0]);
      if (ack) {
        this.queue.shift();
        this.process();
      }
    }
  }

  /**
   * clears all elements from the queue
   */
  empty() {
    this.queue = [];
  }
}
