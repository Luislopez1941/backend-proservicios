import { Module } from '@nestjs/common';
import { AddressValidationService } from './address-validation.service';

@Module({
  providers: [AddressValidationService],
  exports: [AddressValidationService],
})
export class ValidationModule {}
