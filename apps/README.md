# apps

Applications du mono-repo.

| Dossier (prévu) | Rôle |
|-----------------|------|
| **`api/`** | NestJS : Markdown **sync + async** (BullMQ), **images** Grok Imagine, `GET /ai/generated` pour le preview. [api/README.md](./api/README.md). |
| **`preview/`** | Vite + **marked** : liste et rendu des `.md` générés (proxy → API :5175→3040). [preview/README.md](./preview/README.md). |
| **`web/`** (plus tard) | Vitrine **React + TypeScript** lorsque le manifeste et le flux IA seront stabilisés. |

Les sous-dossiers seront ajoutés au fil des itérations.
