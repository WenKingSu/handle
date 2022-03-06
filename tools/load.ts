/* eslint-disable no-console */
import fs from 'fs'
import _polyphones from '../src/data/polyphones.json'
import { normalizePinyin } from './utils'
import { getWordInfoFromZDict } from './zdict'

const polyphones = _polyphones as Record<string, string>
const idioms = fs.readFileSync('src/data/idioms.txt', 'utf8').trim().split('\n')
const newOnes = fs.readFileSync('src/data/new.txt', 'utf8').trim().split('\n')

async function getPinyinWeb(word: string) {
  // @ts-expect-error missing
  const pinyin = await import('pinyin/lib/web-pinyin.js').then(i => i.default) as typeof import('pinyin')
  return pinyin(word, { style: pinyin.STYLE_TONE2 }).map((i: any) => i[0]).join(' ')
}

async function run() {
  const unknown = new Set<string>()
  for (const i of newOnes) {
    console.log(`[${i}] fetching`)
    const data = await getWordInfoFromZDict(i)
    const pinyinZDict = normalizePinyin(data?.pinyin || '')
    console.log(`[${i}] got ${pinyinZDict}`)

    if (!pinyinZDict) {
      unknown.add(i)
      continue
    }

    const p = await getPinyinWeb(i)
    if (!pinyinZDict || p === pinyinZDict) {
      delete polyphones[i]
      idioms.push(i)
      continue
    }
    console.log(`[${i}] Polyphones!`)
    polyphones[i] = pinyinZDict
  }

  fs.writeFileSync('src/data/polyphones.json', JSON.stringify(polyphones, null, 2), 'utf8')
  fs.writeFileSync('src/data/idioms.txt', Array.from(new Set(idioms)).join('\n'), 'utf8')
  fs.writeFileSync('src/data/new.txt', Array.from(unknown).join('\n'), 'utf8')
}

run()