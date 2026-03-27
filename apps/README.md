# apps

Applications du mono-repo.

| Dossier (prévu) | Rôle |
|-----------------|------|
| **`api/`** | Backend **NestJS** : `POST /ai/generate-markdown` (Grok chat → fichier sous `content/generated/arbre-de-vie/`). Voir [api/README.md](./api/README.md). **BullMQ** à venir. |
| **`preview/`** | Rendu **léger** du premier site (HTML/CSS ou générateur statique) pour illustrer le contenu **sans imposer React** au prototype. |
| **`web/`** (plus tard) | Vitrine **React + TypeScript** lorsque le manifeste et le flux IA seront stabilisés. |

Les sous-dossiers seront ajoutés au fil des itérations.
