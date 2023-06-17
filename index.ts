import { promises as fs, constants as fsConst } from 'fs'
import { Canvas, CanvasRenderingContext2D, Image } from 'canvas'
import axios from 'axios'

export interface MemeGeneratorCanvasOptions {
  canvasWidth: number
  canvasHeight: number
}
export interface MemeGeneratorFontOptions {
  fontSize: number
  fontFamily: string
  lineHeight: number
}
export interface MemeGeneratorImageOptions {
  topText: string
  bottomText: string
  url: string
}
export interface MemeGeneratorOptions {
  canvasOptions?: MemeGeneratorCanvasOptions
  fontOptions?: MemeGeneratorFontOptions
}

export default class MemeGenerator {
  canvas!: Canvas
  ctx!: CanvasRenderingContext2D
  canvasImg!: Image
  fontSize!: number
  fontFamily!: string
  lineHeight!: number
  topText!: string
  bottomText!: string
  url!: string
  memeWidth!: number
  memeHeight!: number
  constructor (userConfig: MemeGeneratorOptions = {}) {
    const { canvasOptions, fontOptions } = userConfig
    const config = Object.assign(
      {
        canvasOptions: {
          canvasWidth: 500,
          canvasHeight: 500
        },
        fontOptions: {
          fontFamily: 'impact',
          fontSize: 32,
          lineHeight: 1.2
        }
      },
      canvasOptions ? { canvasOptions } : null,
      fontOptions ? { fontOptions } : null
    )

    this.setCanvas(config.canvasOptions)
    this.setFontOptions(config.fontOptions)
  }

  /**
   *
   * @param {Object} options {canvasWidth, canvasHeight}
   */
  setCanvas (options: MemeGeneratorCanvasOptions): void {
    const { canvasWidth, canvasHeight } = options
    const canvas = new Canvas(canvasWidth, canvasHeight)

    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.canvasImg = new Image()
  }

  /**
   *
   * @param {Object} options {fontFamily, fontSize, lineHeight}
   */
  setFontOptions (options: MemeGeneratorFontOptions): void {
    const { fontFamily, fontSize, lineHeight } = options

    this.fontFamily = fontFamily
    this.fontSize = fontSize
    this.lineHeight = lineHeight
  }

  /**
   * Set meme canvas
   *
   * @param {Object} options {topText, bottomText, url}
   */
  setImageOptions (options: MemeGeneratorImageOptions): void {
    const { topText, bottomText, url } = options

    this.url = url
    this.topText = topText
    this.bottomText = bottomText
  }

  /**
   * Set meme canvas
   *
   * @param {Object} imageOptions {topText, bottomText, url}
   */
  async generateMeme (imageOptions: MemeGeneratorImageOptions): Promise<Buffer> {
    this.setImageOptions(imageOptions)
    try {
      await fs.access(this.url, fsConst.R_OK)
      this.canvasImg.src = this.url

      this.calculateCanvasSize()
      this.drawMeme()

      return this.canvas.toBuffer()
    } catch (e) {
      const res = await axios.get(this.url, { responseType: 'arraybuffer' })
      if (res.status === 200) {
        this.canvasImg.src = Buffer.from(res.data, 'base64')

        this.calculateCanvasSize()
        this.drawMeme()

        return this.canvas.toBuffer()
      } else {
        throw new Error('The image could not be loaded.')
      }
    }
  }

  calculateCanvasSize (): void {
    const { canvas, canvasImg } = this

    canvas.height = (canvasImg.height / canvasImg.width) * canvas.width

    this.memeWidth = canvas.width
    this.memeHeight = canvas.height
  }

  drawMeme (): void {
    const {
      canvas,
      canvasImg,
      memeWidth,
      memeHeight,
      topText,
      bottomText,
      fontSize,
      ctx
    } = this

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(canvasImg, 0, 0, memeWidth, memeHeight)

    const x = memeWidth / 2
    let y

    this.ctx.lineWidth = 4
    this.ctx.strokeStyle = 'black'
    this.ctx.fillStyle = 'white'
    this.ctx.textAlign = 'center'

    if (topText) {
      y = 0
      this.ctx.textBaseline = 'top'
      this.wrapText(topText, x, y, false, fontSize)
    }

    if (bottomText) {
      y = memeHeight
      this.ctx.textBaseline = 'bottom'
      this.wrapText(bottomText, x, y, true, fontSize)
    }
  }

  /**
   *
   * @param {String} text
   * @param {Number} x
   * @param {Number} y
   * @param {Boolean} fromBottom
   * @param {Number} fontSize
   */
  wrapText (
    text: string,
    x: number,
    y: number,
    fromBottom: boolean,
    fontSize: number
  ): void {
    if (!text) {
      return
    }

    this.ctx.font = `bold ${fontSize}pt ${this.fontFamily}`

    const pushMethod = fromBottom ? 'unshift' : 'push'
    const lineHeight = this.lineHeight * fontSize

    const lines: string[] = []
    let line = ''
    const words = text.split(' ')

    for (let n = 0; n < words.length; n++) {
      const testLine = line + ' ' + words[n]
      const metrics = this.ctx.measureText(testLine)
      const testWidth = metrics.width

      if (testWidth > this.memeWidth) {
        lines[pushMethod](line)
        line = words[n] + ' '
      } else {
        line = testLine
      }
    }

    lines[pushMethod](line)

    if (lines.length > 2) {
      this.wrapText(text, x, y, fromBottom, fontSize - 10)
    } else {
      lines.forEach((line, k) => {
        if (fromBottom) {
          this.ctx.strokeText(line, x, y - lineHeight * +k)
          this.ctx.fillText(line, x, y - lineHeight * +k)
        } else {
          this.ctx.strokeText(line, x, y + lineHeight * +k)
          this.ctx.fillText(line, x, y + lineHeight * +k)
        }
      })
    }
  }
}
