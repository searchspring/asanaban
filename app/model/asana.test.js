const Asana = require('./asana')

test('has', () => {
    expect(Asana.convertToAsana('')).toBe('')
    expect(Asana.convertToAsana('hello')).toBe('hello')
    expect(Asana.convertToAsana('just\nsome\ntext')).toBe('just\nsome\ntext')
    expect(Asana.convertToAsana('<span>just</span><span>some</span><span>text</span>')).toBe('just\nsome\ntext')
    expect(Asana.convertToAsana('<span>just\nsome\ntext <span class="mention" data-index="0" data-denotation-char="@" data-id="1140147937013713" data-value="Will Warren"> <span contenteditable="false"><span class="ql-mention-denotation-char">@</span>Will Warren</span> </span> </span>')).
        toBe('just\nsome\ntext <a href="https://app.asana.com/0/1140147937013713/" data-asana-dynamic="true" data-asana-gid="1140147937013713" data-asana-accessible="true" data-asana-type="user">Will Warren</a>')
})