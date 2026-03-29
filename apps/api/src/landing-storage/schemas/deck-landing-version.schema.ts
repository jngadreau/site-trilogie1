import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeckLandingVersionDocument = HydratedDocument<DeckLandingVersion>;

export type DeckLandingVersionStatus = 'draft' | 'published' | 'archived';

@Schema({ collection: 'deck_landing_versions', timestamps: true })
export class DeckLandingVersion {
  @Prop({ type: Types.ObjectId, ref: 'DeckLandingProject', required: true, index: true })
  projectId!: Types.ObjectId;

  @Prop({ required: true })
  versionNumber!: number;

  @Prop({
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  })
  status!: DeckLandingVersionStatus;

  @Prop()
  label?: string;

  /** Ordre réel des sections pour cette version (structure souple, wizard). */
  @Prop({ type: [String], default: [] })
  sectionOrder!: string[];

  @Prop({ type: Object, default: {} })
  variantsBySection!: Record<string, string>;

  /** Document landing complet (équivalent `deck-landings/*.json`, évolutif). */
  @Prop({ type: Object, required: true })
  content!: Record<string, unknown>;
}

export const DeckLandingVersionSchema = SchemaFactory.createForClass(DeckLandingVersion);
DeckLandingVersionSchema.index({ projectId: 1, versionNumber: 1 }, { unique: true });
