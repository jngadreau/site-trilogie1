import { Link } from 'react-router-dom'
import './app-top-nav.css'

type Props = {
  /** Sur une landing deck, hérite des variables CSS `--dl-*`. */
  tone?: 'plain' | 'deck'
}

export function AppTopNav({ tone = 'plain' }: Props) {
  const cls =
    tone === 'deck' ? 'app-top-nav app-top-nav--deck' : 'app-top-nav'
  return (
    <header className={cls}>
      <nav className="app-top-nav__links" aria-label="Navigation principale">
        <Link to="/">Accueil</Link>
        <Link to="/admin">Admin</Link>
      </nav>
    </header>
  )
}
