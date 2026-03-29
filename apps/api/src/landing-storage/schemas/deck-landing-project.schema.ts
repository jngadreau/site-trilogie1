import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeckLandingProjectDocument = HydratedDocument<DeckLandingProject>;

@Schema({ collection: 'deck_landing_projects', timestamps: true })
export class DeckLandingProject {
  /** Ex. `arbre-de-vie` — étape « jeu » du wizard. */
  @Prop({ required: true, index: true })
  gameKey!: string;

  /** Identifiant éditorial unique par jeu (ex. `arbre-de-vie-showcase`). */
  @Prop({ required: true })
  slug!: string;

  @Prop()
  title?: string;

  /** Description globale de la landing (éditeur / marketing). */
  @Prop()
  description?: string;

  /** Descriptions pédagogiques ou briefs par type de section (`hero`, `faq`, …). */
  @Prop({ type: Object, default: {} })
  sectionDescriptions!: Record<string, string>;

  @Prop({ type: Types.ObjectId, ref: 'DeckLandingVersion' })
  currentDraftVersionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DeckLandingVersion' })
  publishedVersionId?: Types.ObjectId;
}

export const DeckLandingProjectSchema = SchemaFactory.createForClass(DeckLandingProject);
DeckLandingProjectSchema.index({ gameKey: 1, slug: 1 }, { unique: true });
