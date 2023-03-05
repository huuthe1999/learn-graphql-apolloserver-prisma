export const splitLastErrorLine = (message: string) => {
  const lastIndexBreak = message.lastIndexOf('\n')

  return lastIndexBreak !== -1 ? message.slice(lastIndexBreak + 1) : null
}
