import pdfParse from 'pdf-parse'

export async function parsePdf(buffer) {
  const result = await pdfParse(buffer)
  return result.text
}
