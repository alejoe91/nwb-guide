
import { afterAll, beforeAll, expect, describe, vi, test } from 'vitest'

import * as puppeteer from 'puppeteer'

import { exec } from 'child_process'
import { electronDebugPort } from '../globals.js'

export const sharePort = 1234

import { sleep } from '../utils.js';


const beforeStart = (timeout) => new Promise(async (resolve, reject) => {

  const handleOutput = (data) => {
    if (data.includes('WINDOW READY FOR TESTING')) resolve(true)
    console.log(`[electron] ${data}`)
  }

  const process = exec('npm start') // Run Start Script from package.json
  process.stdout.on('data', handleOutput);
  process.stderr.on('data', handleOutput);
  process.on('close', (code) => console.log(`[electron] Exited with code ${code}`));
  await sleep(timeout) // Wait for five seconds for Electron to open

  reject('Failed to open Electron window successfully.')
})

type BrowserTestOutput = {
  info?: any
  page?: puppeteer.Page,
  browser?: puppeteer.Browser,
}

const beforeStartTimeout = 60 * 1000 // Wait for 1 minute for Electron to open (mostly for Windows)
const launchProtocolTimeout = 6 * 60 * 1000 // Creating the test dataset can take up to 6 minutes (mostly for Windows)

export const connect = () => {


  const output: BrowserTestOutput = {}


  beforeAll(async () => {

    await beforeStart(beforeStartTimeout)

    // Ensure Electron will exit gracefully
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        mockExit.mockRestore()
    });

    const browserURL = `http://localhost:${electronDebugPort}`
    const browser = output.browser = await puppeteer.launch({ headless: 'new', protocolTimeout: launchProtocolTimeout})
    const page = output.page = await browser.newPage();
    await page.goto(browserURL);
    const endpoint = await page.evaluate(() => fetch(`json/version`).then(res => res.json()).then(res => res.webSocketDebuggerUrl))
    await browser.close()
    delete output.browser
    delete output.page

    // Connect to browser WS Endpoint
    const browserWSEndpoint = endpoint.replace('localhost', '0.0.0.0')
    output.browser = await puppeteer.connect({ browserWSEndpoint, defaultViewport: null })

    const pages = await output.browser.pages()
    output.page = pages[0]

  }, beforeStartTimeout + 1000)

  afterAll(async () => {
    if (output.browser) await output.browser.close() // Will also exit the Electron instance
  });

  return output

}
