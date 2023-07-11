import { StatusCodes } from 'http-status-codes'
import CustomAPIError from './custom-error'

export default class Forbidden extends CustomAPIError {
  constructor(message: string) {
    super(message, StatusCodes.FORBIDDEN)
  }
}
