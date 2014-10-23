###
  This is essentially a copy from the snippet completer from Ace's ext/language-tools.js
  However this completer assigns a score to the snippets to ensure that snippet suggestions are
  treated better in the autocomplete than local values
###
{score} = require 'fuzzaldrin'

module.exports = (SnippetManager, autoLineEndings) ->
  {Range} = ace.require 'ace/range'
  util = ace.require 'ace/autocomplete/util'
  
  getCurrentWord = (doc, pos) ->
    end = pos.column
    start = end - 1
    text = doc.getLine(pos.row)
    start-- while start >= 0 and not text[start].match /\s+|[\.\@]/
    start++ if start >= 0
    text = text.substring start, end

  scrubSnippet = (snippet, caption, line, prefix, pos, lang) ->
    # console.log "Zatanna snippet=#{snippet} caption=#{caption} line=#{line} prefix=#{prefix} pos.column=#{pos.column} lang=#{lang}"
    # trim snippet prefix and suffix if already in the document (line)
    if prefixStart = snippet.toLowerCase().indexOf(prefix.toLowerCase()) > -1
      captionStart = snippet.indexOf caption
      snippetPrefix = snippet.substring 0, captionStart
      if pos.column - prefix.length - snippetPrefix.length >= 0
        linePrefix = line.substr pos.column - prefix.length - snippetPrefix.length, snippetPrefix.length
      else
        linePrefix = ''
      snippetSuffix = snippet.substring snippetPrefix.length + caption.length
      lineSuffix = line.substr pos.column, snippetSuffix.length
      if snippetPrefix.length > 0 and snippetPrefix is linePrefix
        snippet = snippet.slice snippetPrefix.length 
      if snippetSuffix.length > 0 and snippetSuffix is lineSuffix
        snippet = snippet.slice 0, snippet.length - snippetSuffix.length
      
      # append automatic line ending if no line suffix and at end of line
      if autoLineEndings[lang] and /^\s*$/.test(lineSuffix)
        snippet += autoLineEndings[lang]
      # console.log "Zatanna snippetPrefix=#{snippetPrefix} linePrefix=#{linePrefix} snippetSuffix=#{snippetSuffix} lineSuffix=#{lineSuffix} snippet=#{snippet}"
    snippet

  getCompletions: (editor, session, pos, prefix, callback) ->
    # Completion format:
    # caption: displayed left-justified in popup, and what's being matched
    # snippet: what will be inserted into document
    # score: TODO: what is this for?
    # meta: displayed right-justfied in popup
    lang = session.getMode()?.$id?.substr 'ace/mode/'.length
    line = session.getLine pos.row
    prefix = util.retrievePrecedingIdentifier line, pos.column
    word = getCurrentWord session, pos
    snippetMap = SnippetManager.snippetMap
    completions = []
    SnippetManager.getActiveScopes(editor).forEach (scope) ->
      snippets = snippetMap[scope] or []
      for s in snippets
        caption  = s.name or s.tabTrigger
        continue unless caption
        completions.push 
          caption: caption
          snippet: scrubSnippet s.content, caption, line, prefix, pos, lang
          score: (score caption, word) + 0.1
          meta: s.meta or (if s.tabTrigger and not s.name then s.tabTrigger + '\u21E5' else 'snippets')
    , @
    @completions = completions
    callback null, completions