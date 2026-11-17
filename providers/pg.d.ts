declare module 'pg' {
  const pg: {
    types: {
      setTypeParser(oid: number, parse: (value: string) => unknown): void
    }
  }

  export default pg
}
