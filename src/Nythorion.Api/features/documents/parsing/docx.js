import mammoth from 'mammoth'

export async function parseDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}
