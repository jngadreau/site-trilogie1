import { IsString, Matches, MaxLength } from 'class-validator';

export class SelectDeckLandingHistoryImageDto {
  @IsString()
  @Matches(/^[a-z0-9_]+:[a-z0-9_]+$/, {
    message: 'positionKey doit être sectionId:slotId (ex. hero:hero)',
  })
  @MaxLength(80)
  positionKey!: string;

  @IsString()
  @MaxLength(80)
  versionId!: string;
}
