import * as cheerio from 'cheerio'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const URL = {
  leaderboard: 'https://kingsleague.pro/estadisticas/clasificacion/'
}

const scrape = async (url) => {
  const res = await fetch(url)
  const html = await res.text()
  return cheerio.load(html)
}

const LEADERBOARD_SELECTORS = {
  Team: { selector: '.fs-table-text_3', typeOf: 'string' },
  Wins: { selector: '.fs-table-text_4', typeOf: 'number' },
  Loses: { selector: '.fs-table-text_5', typeOf: 'number' },
  ScoredGoals: { selector: '.fs-table-text_6', typeOf: 'number' },
  AgainsGoals: { selector: '.fs-table-text_7', typeOf: 'number' },
  YellowCard: { selector: '.fs-table-text_8', typeOf: 'number' },
  RedCards: { selector: '.fs-table-text_9', typeOf: 'number' }
}

const getLeaderBoard = async (url) => {
  const $ = await scrape(URL.leaderboard)
  const leaderboard = []
  const $row = $('table tbody tr')
  const leaderboardSelectorEntries = Object.entries(LEADERBOARD_SELECTORS)

  const cleanText = (text) => text.replace(/\t|\n|\s:/g, '').replace(/.*:/g, '')

  $row.each((index, el) => {
    const leaderboardEntries = leaderboardSelectorEntries.map(([key, { selector, typeOf }]) => {
      const rowValue = $(el).find(selector).text()
      const cleanedValue = cleanText(rowValue)

      const value = typeOf === 'number'
        ? Number(cleanedValue)
        : cleanedValue

      return [key, value]
    })

    leaderboard.push(Object.fromEntries(leaderboardEntries))
  })

  return leaderboard
}

const leaderboard = await getLeaderBoard()

const filePath = path.join(process.cwd(), './db/leaderboard.json')

await writeFile(filePath, JSON.stringify(leaderboard, null, 2), 'utf-8')
