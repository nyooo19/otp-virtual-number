import { TripayGateway } from './TripayGateway.js';
import { QrisyGateway } from './QrisyGateway.js';
import logger from '../config/logger.js';

export class PaymentGatewayFactory {
  static getGateway(gatewayCode) {
    switch (gatewayCode) {
      case 'tripay':
        return new TripayGateway();
      case 'qrispy':
        return new QrisyGateway();
      default:
        throw new Error(`Unknown payment gateway: ${gatewayCode}`);
    }
  }

  static getAvailableGateways() {
    return ['tripay', 'qrispy'];
  }
}