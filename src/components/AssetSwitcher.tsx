import { Fragment } from 'react'
import { CANDIDATES, type AssetConfig, type AssetKind } from '../config'

type Props = {
  config: AssetConfig
  hidden: boolean
  onChange: (kind: AssetKind, value: string) => void
}

const LABELS: Record<AssetKind, string> = {
  ground: 'Ground',
  hedge: 'Hedge',
  hdri: 'Sky',
}

export function AssetSwitcher({ config, hidden, onChange }: Props) {
  return (
    <div className={`switcher${hidden ? ' is-hidden' : ''}`}>
      {(Object.keys(CANDIDATES) as AssetKind[]).map((kind) => (
        <Fragment key={kind}>
          <label>{LABELS[kind]}</label>
          <select
            value={config[kind]}
            onChange={(e) => onChange(kind, e.target.value)}
          >
            {CANDIDATES[kind].map((slug) => (
              <option key={slug} value={slug}>{slug}</option>
            ))}
          </select>
        </Fragment>
      ))}
    </div>
  )
}
