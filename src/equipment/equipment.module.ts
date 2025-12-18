import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentService } from './equipment.service';
import { EquipmentController } from './equipment.controller';
import { EquipmentTransferService } from './equipment-transfer.service';
import { EquipmentTransferController } from './equipment-transfer.controller';
import { Equipment } from './entities/equipment.entity';
import { EquipmentTransfer } from './entities/equipment-transfer.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Equipment, EquipmentTransfer, User])],
  controllers: [EquipmentController, EquipmentTransferController],
  providers: [EquipmentService, EquipmentTransferService],
  exports: [EquipmentService, EquipmentTransferService],
})
export class EquipmentModule {}
