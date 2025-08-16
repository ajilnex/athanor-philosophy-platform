describe('Configuration Jest', () => {
  it('Jest fonctionne correctement', () => {
    expect(1 + 1).toBe(2)
  })

  it('mock functions work', () => {
    const mockFn = jest.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
  })
})
