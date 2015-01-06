(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Based upon:
 * A Dynamic Programming Algorithm for Name Matching
 * Top, P.;   Dowla, F.;   Gansemer, J.;   
 * Sch. of Electr. & Comput. Eng., Purdue Univ., West Lafayette, IN
 *
 * Variation in JavaScript
 * Copyright © 2011, Christopher Stoll
 * @author <a href="http://www.christopherstoll.org/">Christopher Stoll</a>
 *
 * @constructor
 * @param {String} [pNameSource=''] The source name, the name of interest
 * @param {Boolean} [pDebug=false] The instance is in debugging mode
 * @param {String} [pDebugOutputArea=''] Where to put debuging output
 */
function fuzziac(pNameSource, pDebug, pDebugOutputArea){
  var tNameSource = pNameSource || '';
  
  if(tNameSource){
    // convert "last, first" to "first last"
    if(tNameSource.indexOf(',') > 0){
      var tIndex = tNameSource.indexOf(','),
        tFirst = tNameSource.slice(tIndex+1),
        tLast = tNameSource.slice(0, tIndex);
      tNameSource = tFirst + ' ' + tLast;
    }
    
    // all lowercase, no special characters, and no double sapces
    tNameSource = tNameSource.toLowerCase();
    tNameSource = tNameSource.replace(/[.'"]/ig, ' ');
    tNameSource = tNameSource.replace(/\s{2,}/g, ' ');
  }
  
  // TODO: remove when converted for string matching only
  // debug variables
  this.DEBUG = pDebug || false;
  this.DEBUG_AREA = pDebugOutputArea;
  
  // y axis in matrix, the name in question
  this.nameSource = tNameSource;
  this.nameSourceLength = this.nameSource.length + 1;
  this.nameSourceScore = 0;
  this._reset();
}

fuzziac.prototype = {
  /**
   * Reset class variables
   * @private
   */
  _reset: function(pNameTarget){
    var tNameTarget = pNameTarget || '';
    
    // TODO: remove when converted for string matching only
    if(tNameTarget){
      tNameTarget = tNameTarget.toLowerCase();
      tNameTarget = tNameTarget.replace(/[.,'"]/ig, '');
      tNameTarget = tNameTarget.replace(/\s{2,}/g, ' ');
    }
    
    // x axis in matrix, the name to check against
    this.nameTarget = tNameTarget;
    this.nameTargetLength = this.nameTarget.length + 1;
    this.nameTargetScore = 0;
  
    // DV, the dunamic programming matrix
    this.dynamicMatrix = [];
    
    // Max value in the matrix
    this.maxMatrixValue = 0;
    
    // the score for the string
    this.overallScore = 0;
    
    // weighted average of string and tokens
    this.finalScore = 0;
  },
  
  /**
   * CM, character mismatch lookup,
   * Abreviated 2D array for hex values
   *
   * @static
   * @field
   */
  characterMatrix: [
    //bcdefghijklmnopqrstuvwxyz
    'a0004000000000400000000000', // a
    '0a000000000000000000000000', // b
    '00a00000004000002000000000', // c
    '000a0000000000000002000000', // d
    '4000a000000000000000000020', // e
    '00000a00000000020000020000', // f
    '000000a0000000000000000000', // g
    '0000000a040000000000000000', // h
    '00000000a20400000000000020', // i
    '000000042a0000000000000040', // j
    '0040000000a000002000000000', // k
    '00000000400a00000000000000', // l
    '000000000000a4000000000000', // m
    '0000000000004a000000000000', // n
    '40000000000000a00000000000', // o
    '000002000000000a0000000000', // p
    '0020000000200000a000000000', // q
    '00000000000000000a00000000', // r
    '000000000000000000a0000000', // s
    '0002000000000000000a000000', // t
    '00000000000000000000a00000', // u
    '000002000000000000000a4000', // v
    '0000000000000000000004a000', // w
    '00000000000000000000000a00', // x
    '000020002400000000000000a0', // y
    '0000000000000000002000000a', // z
    '00000000000000400000000000', // 0
    '00000000400400000000000000', // 1
    '00000000000000000100000002', // 2
    '00002000000000000000000001', // 3
    '20000002000000000000000000', // 4
    '00000000000000000020000000', // 5
    '01000010000000000000000000', // 6
    '00000000100100000002000000', // 7
    '01000000000000000000000000', // 8
    '00000020000000000000000000'  // 9
  ],
  
  /**
   * Dictionary to speed lookups in the character matrix
   *
   * @static
   * @field
   */
  charMatrixDictionary: {
    a: 0,
    b: 1,
    c: 2,
    d: 3,
    e: 4,
    f: 5,
    g: 6,
    h: 7,
    i: 8,
    j: 9,
    k: 10,
    l: 11,
    m: 12,
    n: 13,
    o: 14,
    p: 15,
    q: 16,
    r: 17,
    s: 18,
    t: 19,
    u: 20,
    v: 21,
    w: 22,
    x: 23,
    y: 24,
    z: 25,
    0: 26,
    1: 27,
    2: 28,
    3: 29,
    4: 30,
    5: 31,
    6: 32,
    7: 33,
    8: 34,
    9: 35
  },
  
  /**
   * Return a matching score for two characters
   *
   * @private
   * @param {String} pCharA The first character to test
   * @param {String} pCharB The second character to test
   * @returns {Number} Score for the current characters
   */
  _characterScore: function(pCharA, pCharB){
    var matchScore = 10,
      mismatchScore = 0,
      mismatchPenalty = -4,
      charIndexA = 0,
      charIndexB = 0,
      refValue = 0;
      
    if(pCharA && pCharB){
      if(pCharA == pCharB){
        return matchScore;
      }else{
        charIndexA = this.charMatrixDictionary[pCharA];
        charIndexB = this.charMatrixDictionary[pCharB];
        
        if(charIndexA && charIndexB){
          mismatchScore = this.characterMatrix[charIndexA][charIndexB]
          refValue = parseInt(mismatchScore, 16);

          if(refValue){
            return refValue;
          }else{
            return mismatchPenalty;
          }
        }else{
          return mismatchPenalty;
        }
      }
    }else{
      return mismatchPenalty;
    }
  },
  
  /**
   * Return a score for string gaps
   *
   * @private
   * @param {String} pCharA The first character to test
   * @param {String} pCharB The second character to test
   * @returns {Number} Score for the current characters
   */
  _gappedScore: function(pCharA, pCharB){
    var gapPenalty = -3,
      mismatchPenalty = -4;
      
    if((pCharA == ' ') || (pCharB == ' ')){
      return gapPenalty;
    }else{
      return mismatchPenalty;
    }
  },
  
  /**
   * Return a score for transposed strings
   * TODO: Either actuallly check for transposed characters or eliminate
   *
   * @private
   * @param {String} pCharA The first character to test
   * @param {String} pCharB The second character to test
   * @returns {Number} Score for the current characters
   */
  _transposedScore: function(pCharA, pCharB){
    var transposePenalty = -2;
    return transposePenalty;
  },
  
  /**
   * Build the dynamic programming matrix for the two current strings 
   * @private
   */
  _buildMatrix: function(){
    var tmpArray = [],
      tCharA = '',
      tCharB = '',
      gapScore = 0;
    
    // fill DV, the dynamic programming matrix, with zeros
    for(var ix=0; ix<this.nameTargetLength; ix++){
      tmpArray.push(0);
    }
    for(var iy=0; iy<this.nameSourceLength; iy++){
      this.dynamicMatrix.push(tmpArray.slice(0));
    }
    
    // calculate the actual values for DV
    for(var iy=1; iy<this.nameSourceLength; iy++){
      for(var ix=1; ix<this.nameTargetLength; ix++){
        tCharA = this.nameSource[iy-1];
        tCharB = this.nameTarget[ix-1];
        
        gapScore = this._gappedScore(tCharA, tCharB);
        this.dynamicMatrix[iy][ix] = Math.max(
          this.dynamicMatrix[iy-1][ix-1] + this._characterScore(tCharA, tCharB),
          0,
          this.dynamicMatrix[iy-1][ix] + gapScore,
          this.dynamicMatrix[iy][ix-1] + gapScore
        );
        
        if((this.dynamicMatrix[iy-1][ix] > this.dynamicMatrix[iy-1][ix-1]) && 
          (this.dynamicMatrix[iy][ix-1] > this.dynamicMatrix[iy-1][ix-1])){
          
          this.dynamicMatrix[iy-1][ix-1] = Math.max(
            this.dynamicMatrix[iy-1][ix],
            this.dynamicMatrix[iy][ix-1]
          );
          this.dynamicMatrix[iy][ix] = Math.max(
            this.dynamicMatrix[iy-1][ix-1] + this._transposedScore(tCharA, tCharB),
            this.dynamicMatrix[iy][ix]
          );
        }
      }
    }
  },
  
  /**
   * Backtrack through the matrix to find the best path
   * @private
   */
  _backtrack: function(){
    var tmaxi = 0,
      maxix = 0;
    
    // find the intial local max
    for(var ix=this.nameTargetLength-1; ix>0; ix--){
      if(this.dynamicMatrix[this.nameSourceLength-1][ix] > tmaxi){
        tmaxi = this.dynamicMatrix[this.nameSourceLength-1][ix];
        maxix = ix;
      }
      
      // break out of loop if we have reached zeros after non zeros
      if((tmaxi > 0) && (this.dynamicMatrix[this.nameSourceLength-1][ix+1] == 0)){
        break;
      }
    }
    
    if(tmaxi <= 0){
      return false;
    }
    
    var ix = maxix,
      iy = this.nameSourceLength-1,
      ixLast = 0,
      iyLast = 0,
      diagonal = 0,
      above = 0,
      left = 0;
    
    // TODO: replace with better algo or refactor
    while((iy>0) && (ix>0)){
      // store max value
      if(this.dynamicMatrix[iy][ix] > this.maxMatrixValue){
        this.maxMatrixValue = this.dynamicMatrix[iy][ix];
      }
      
      // DEBUG
      if(this.DEBUG){
        $('#'+this.DEBUG_AC+'-'+(iy+1)+'-'+(ix+1)).css('background-color','#ccc');
      }
      
      // calculate values for possible paths
      diagonal = this.dynamicMatrix[iy-1][ix-1];
      above = this.dynamicMatrix[iy][ix-1];
      left = this.dynamicMatrix[iy-1][ix];
      
      // choose next path
      if((diagonal>=above) && (diagonal>=left)){
        iy--;
        ix--;
      }else if((above>=diagonal) && (above>=left)){
        ix--;
      }else if((left>=diagonal) && (left>=above)){
        iy--;
      }
      
      // end while if we have all zeros
      if((diagonal == 0) && (above == 0) && (left == 0)){
        iy = 0;
        ix = 0;
      }
    }
    
    return true;
  },
  
  /**
   * Calculate the final match score for this pair of names
   * @private
   */
  _finalMatchScore: function(){
    var averageNameLength = (this.nameSourceLength + this.nameTargetLength) / 2
    this.overallScore = (2 * this.maxMatrixValue) / averageNameLength;
    this.finalScore = this.overallScore / 10;
  },
  
  /**
   * Display debug information
   * TODO: remove when converted for string matching only
   *
   * @private
   */
  _debug_ShowDVtable: function(){
    var DEBUG_AA = 0,
      DEBUG_AB = '';
      DEBUG_AC = Math.round(Math.random() * 9999);
      
    this.DEBUG_AC = DEBUG_AC;
      
    DEBUG_AB += '<table class="example">';
    for(var iy=0; iy<=(this.nameSourceLength); iy++){
      DEBUG_AB += '<tr>';
      for(var ix=0; ix<=(this.nameTargetLength); ix++){
        if(iy==0){
          if(ix>1){
            DEBUG_AB += '<td id="'+DEBUG_AC+'-'+iy+'-'+ix+'">'+this.nameTarget[ix-2]+'</td>';
          }else{
            DEBUG_AB += '<td id="'+DEBUG_AC+'-'+iy+'-'+ix+'"></td>';
          }
        }else{
          if(ix>0){
            DEBUG_AA = Math.round(this.dynamicMatrix[iy-1][ix-1] * 100) / 100;
            DEBUG_AB += '<td id="'+DEBUG_AC+'-'+iy+'-'+ix+'">'+DEBUG_AA+'</td>';
          }else{
            if(iy>1){
              DEBUG_AB += '<td id="'+DEBUG_AC+'-'+iy+'-'+ix+'">'+this.nameSource[iy-2]+'</td>';
            }else{
              DEBUG_AB += '<td id="'+DEBUG_AC+'-'+iy+'-'+ix+'"></td>';
            }
          }
        }
      }
      DEBUG_AB += '</tr>';
    }
    DEBUG_AB += '</table>';
    $(this.DEBUG_AREA).append(DEBUG_AB);
  },
  
  /**
   * Public method to perform a search
   *
   * @param {String} pNameTarget The target to compare the source with
   * @returns The match score of the two strings
   */
  score: function(pNameTarget){
    this._reset(pNameTarget);
    
    this._buildMatrix();
    
    if(this.DEBUG){
      this._debug_ShowDVtable();
    }
    
    this._backtrack();
    this._finalMatchScore();	
    return this.finalScore;
  },

  /**
   * Find matches from an array of choices
   *
   * @param {String[]} pArray The array of strings to check against
   * @param {Number} [10] pLimit The number of resutls to return 
   * @returns {string[]} The top matching strings
   */
  topMatchesFromArray: function(pArray, pLimit){
    var tmpValue = 0,
      tmpValRound = 0,
      worstValue = 0,
      resultLimit = pLimit || 10,
      resultArray = [];
      
    for(var i=0; i<resultLimit; ++i){
      resultArray.push({v:0,n:'-'});
    }
    
    //var dateStart = {},
    //	dateEnd = {},
    
    // Emperical Analysis
    //dateStart = new Date();

    // check against all names in the name list
    for(var i=0; i<pArray.length; i++){
      tmpValue = this.score(allNames[i]);
      //tmpValRound = String(Math.round(tmpValue * 100) / 1000);

      // add selected names to drop-down list
      // does unnecessary work, refactor to improve speed
      if(tmpValue > resultArray[resultLimit-1].v){
        newObj = {v:tmpValue,n:pArray[i]};
        tmpObj = {v:0,n:''};
        for(var j=0; j<resultLimit; ++j){
          if(newObj.v > resultArray[j].v){
            tmpObj.v = resultArray[j].v;
            tmpObj.n = resultArray[j].n;
            resultArray[j].v = newObj.v;
            resultArray[j].n = newObj.n;
            newObj.v = tmpObj.v;
            newObj.n = tmpObj.n;
          }
        }
      }
    }

    for(var i=0; i<resultArray.length; i++){
      tmp = resultArray[i];
      //resultArray[i] = tmp.v + ' ~~ ' + tmp.n;
      resultArray[i] = tmp.n;
    }

    // Emperical Analysis
    //dateEnd = new Date();
    //timeElapsed = dateEnd.getTime() - dateStart.getTime();
    //console.log('topMatchesFromArray:', timeElapsed);

    return resultArray;
  }
}

module.exports.fuzziac = fuzziac;
},{}],2:[function(require,module,exports){

/*
  This is essentially a copy from the snippet completer from Ace's ext/language-tools.js
  However this completer assigns a score to the snippets to ensure that snippet suggestions are
  treated better in the autocomplete than local values
 */

(function() {
  var Fuzziac, getCurrentWord, identifierRegex, lineBreak, score, scrubSnippet;

  score = require('fuzzaldrin').score;

  lineBreak = /\r\n|[\n\r\u2028\u2029]/g;

  identifierRegex = /[\.a-zA-Z_0-9\$\-\u00A2-\uFFFF]/;

  Fuzziac = require('../../assets/fuzziac.js');

  module.exports = function(SnippetManager, autoLineEndings) {
    var Range, baseInsertSnippet, util;
    Range = ace.require('ace/range').Range;
    util = ace.require('ace/autocomplete/util');
    ({
      identifierRegexps: [identifierRegex]
    });
    baseInsertSnippet = SnippetManager.insertSnippet;
    SnippetManager.insertSnippet = function(editor, snippet) {
      var completer, completion, cursor, extraEndLength, extraIndex, finalScore, fuzzer, lang, line, originalCompletion, originalObject, originalPrefix, prevObject, prevObjectIndex, prevWord, prevWordIndex, range, snippetIndex, snippetStart, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
      cursor = editor.getCursorPosition();
      if (cursor.column > 0) {
        line = editor.session.getLine(cursor.row);
        prevWord = util.retrievePrecedingIdentifier(line, cursor.column - 1, identifierRegex);
        if (prevWord.length > 0) {
          prevWordIndex = snippet.toLowerCase().indexOf(prevWord.toLowerCase());
          if (prevWordIndex === 0) {
            range = new Range(cursor.row, cursor.column - 1 - prevWord.length, cursor.row, cursor.column);
            editor.session.remove(range);
          } else {
            _ref = editor.completers;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              completer = _ref[_i];
              if (completer.completions != null) {
                _ref1 = completer.completions;
                for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                  completion = _ref1[_j];
                  if (completion.snippet === snippet) {
                    originalCompletion = completion;
                    break;
                  }
                }
                if (originalCompletion) {
                  break;
                }
              }
            }
            if (originalCompletion != null) {
              lang = (_ref2 = editor.session.getMode()) != null ? (_ref3 = _ref2.$id) != null ? _ref3.substr('ace/mode/'.length) : void 0 : void 0;
              extraEndLength = 1;
              if (autoLineEndings[lang] != null) {
                extraEndLength += autoLineEndings[lang].length;
              }
              if (snippetIndex = originalCompletion.content.indexOf(snippet.substr(0, snippet.length - extraEndLength))) {
                originalPrefix = originalCompletion.content.substring(0, snippetIndex);
              } else {
                originalPrefix = '';
              }
              snippetStart = cursor.column - originalPrefix.length;
              if (snippetStart > 0 && snippetStart <= line.length) {
                extraIndex = snippetStart - 1;
                if (line[extraIndex] === '.') {
                  originalObject = originalCompletion.content.substring(0, originalCompletion.content.indexOf('.'));
                  prevObjectIndex = extraIndex - 1;
                  if (prevObjectIndex >= 0 && /\w/.test(line[prevObjectIndex])) {
                    while (prevObjectIndex >= 0 && /\w/.test(line[prevObjectIndex])) {
                      prevObjectIndex--;
                    }
                    if (prevObjectIndex < 0 || !/\w/.test(line[prevObjectIndex])) {
                      prevObjectIndex++;
                    }
                    prevObject = line.substring(prevObjectIndex, extraIndex);
                    fuzzer = new Fuzziac.fuzziac(originalObject);
                    if (fuzzer) {
                      finalScore = fuzzer.score(prevObject);
                      if (finalScore > 0.5) {
                        range = new Range(cursor.row, prevObjectIndex, cursor.row, snippetStart);
                        editor.session.remove(range);
                      }
                    }
                  }
                } else if (/\w/.test(line[extraIndex])) {
                  while (extraIndex >= 0 && /\w/.test(line[extraIndex])) {
                    extraIndex--;
                  }
                  if (extraIndex < 0 || !/\w/.test(line[extraIndex])) {
                    extraIndex++;
                  }
                  range = new Range(cursor.row, extraIndex, cursor.row, snippetStart);
                  editor.session.remove(range);
                }
              }
            }
          }
        }
      }
      return baseInsertSnippet.call(this, editor, snippet);
    };
    return {
      getCompletions: function(editor, session, pos, prefix, callback) {
        var completions, lang, line, snippetMap, word, _ref, _ref1;
        lang = (_ref = session.getMode()) != null ? (_ref1 = _ref.$id) != null ? _ref1.substr('ace/mode/'.length) : void 0 : void 0;
        line = session.getLine(pos.row);
        word = getCurrentWord(session, pos);
        snippetMap = SnippetManager.snippetMap;
        completions = [];
        SnippetManager.getActiveScopes(editor).forEach(function(scope) {
          var caption, fuzzScore, s, snippet, snippets, _i, _len, _ref2, _results;
          snippets = snippetMap[scope] || [];
          _results = [];
          for (_i = 0, _len = snippets.length; _i < _len; _i++) {
            s = snippets[_i];
            caption = s.name || s.tabTrigger;
            if (!caption) {
              continue;
            }
            _ref2 = scrubSnippet(s.content, caption, line, prefix, pos, lang, autoLineEndings), snippet = _ref2[0], fuzzScore = _ref2[1];
            _results.push(completions.push({
              content: s.content,
              caption: caption,
              snippet: snippet,
              score: fuzzScore,
              meta: s.meta || (s.tabTrigger && !s.name ? s.tabTrigger + '\u21E5' : 'snippets')
            }));
          }
          return _results;
        }, this);
        this.completions = completions;
        return callback(null, completions);
      }
    };
  };

  getCurrentWord = function(doc, pos) {
    var end, start, text;
    end = pos.column;
    start = end - 1;
    text = doc.getLine(pos.row);
    while (start >= 0 && !text[start].match(/\s+|[\.\@]/)) {
      start--;
    }
    if (start >= 0) {
      start++;
    }
    return text.substring(start, end);
  };

  scrubSnippet = function(snippet, caption, line, input, pos, lang, autoLineEndings) {
    var captionStart, fuzzScore, linePrefix, linePrefixIndex, lineSuffix, prefixStart, snippetLines, snippetPrefix, snippetPrefixIndex, snippetSuffix;
    fuzzScore = 0.1;
    if (prefixStart = snippet.toLowerCase().indexOf(input.toLowerCase()) > -1) {
      snippetLines = (snippet.match(lineBreak) || []).length;
      captionStart = snippet.indexOf(caption);
      snippetPrefix = snippet.substring(0, captionStart);
      snippetSuffix = snippet.substring(snippetPrefix.length + caption.length);
      linePrefixIndex = pos.column - input.length - 1;
      if (linePrefixIndex >= 0 && snippetPrefix.length > 0 && line[linePrefixIndex] === snippetPrefix[snippetPrefix.length - 1]) {
        snippetPrefixIndex = snippetPrefix.length - 1;
        while (line[linePrefixIndex] === snippetPrefix[snippetPrefixIndex]) {
          if (linePrefixIndex === 0 || snippetPrefixIndex === 0) {
            break;
          }
          linePrefixIndex--;
          snippetPrefixIndex--;
        }
        linePrefix = line.substr(linePrefixIndex, pos.column - input.length - linePrefixIndex);
      } else {
        linePrefix = '';
      }
      lineSuffix = line.substr(pos.column, snippetSuffix.length - 1 + caption.length - input.length + 1);
      if (snippet.indexOf(lineSuffix) < 0) {
        lineSuffix = '';
      }
      if (pos.column - input.length >= 0 && line[pos.column - input.length - 1] === '(' && pos.column < line.length && line[pos.column] === ')' && lineSuffix === ')') {
        lineSuffix = '';
      }
      fuzzScore += score(snippet, linePrefix + input + lineSuffix);
      if (snippetPrefix.length > 0 && snippetPrefix === linePrefix) {
        snippet = snippet.slice(snippetPrefix.length);
      }
      if (lineSuffix.length > 0) {
        snippet = snippet.slice(0, snippet.length - lineSuffix.length);
      }
      if (lineSuffix.length === 0 && /^\s*$/.test(line.slice(pos.column))) {
        if (linePrefixIndex < 0 || linePrefixIndex >= 0 && !/[\(\)]/.test(line.substring(0, linePrefixIndex + 1)) && !/^[ \t]*(?:if |elif )/.test(line.substring(0, linePrefixIndex + 1))) {
          if (snippetLines === 0 && autoLineEndings[lang]) {
            snippet += autoLineEndings[lang];
          }
          if (snippetLines === 0 && !/\$\{/.test(snippet)) {
            snippet += "\n";
          }
        }
      }
    } else {
      fuzzScore += score(snippet, input);
    }
    return [snippet, fuzzScore];
  };

}).call(this);

},{"../../assets/fuzziac.js":1,"fuzzaldrin":8}],3:[function(require,module,exports){
(function() {
  var checkToken, fuzzaldrin, splitRegex,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  fuzzaldrin = require('fuzzaldrin');

  splitRegex = /[^a-zA-Z_0-9\$\-\u00C0-\u1FFF\u2C00-\uD7FF\w]+/;

  module.exports = function(editor, bgTokenizer, snippetsCompleter) {
    var Range, dictionary, getCurrentWord, handleTokenUpdate;
    Range = ace.require('ace/range').Range;
    dictionary = [];
    handleTokenUpdate = function(e) {
      var newDictionary, noLines, row, tok, tokens, _i, _j, _len;
      bgTokenizer.setDocument(editor.getSession().getDocument());
      newDictionary = [];
      noLines = e.data.last;
      for (row = _i = 0; 0 <= noLines ? _i < noLines : _i > noLines; row = 0 <= noLines ? ++_i : --_i) {
        tokens = bgTokenizer.getTokens(row);
        for (_j = 0, _len = tokens.length; _j < _len; _j++) {
          tok = tokens[_j];
          if (!checkToken(tok)) {
            continue;
          }
          if (/^@/.test(tok.value)) {
            tok.value = tok.value.substring(1);
          }
          newDictionary.push({
            caption: tok.value,
            value: tok.value,
            meta: 'press enter'
          });
        }
      }
      return dictionary = _.uniq(newDictionary, function(el) {
        return el.value;
      });
    };
    bgTokenizer.on('update', handleTokenUpdate);
    getCurrentWord = function(doc, pos) {
      var text, textBefore;
      textBefore = doc.getTextRange(Range.fromPoints({
        row: 0,
        column: 0
      }, pos));
      text = doc.getValue();
      text = text.substr(textBefore.length);
      return text.split(splitRegex)[0];
    };
    return {
      getCompletions: function(editor, session, pos, prefix, callback) {
        var comp, completions, noLines, snippetCompletions, suggestion, word, _i, _len;
        completions = [];
        noLines = session.getLength();
        word = getCurrentWord(session, pos);
        completions = fuzzaldrin.filter(dictionary, word, {
          key: 'value'
        });
        if ((snippetsCompleter != null ? snippetsCompleter.completions : void 0) != null) {
          snippetCompletions = snippetsCompleter.completions.map(function(comp) {
            return comp.caption;
          });
          completions = (function() {
            var _i, _len, _ref, _results;
            _results = [];
            for (_i = 0, _len = completions.length; _i < _len; _i++) {
              comp = completions[_i];
              if (_ref = comp.caption, __indexOf.call(snippetCompletions, _ref) < 0) {
                _results.push(comp);
              }
            }
            return _results;
          })();
        }
        completions = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = completions.length; _i < _len; _i++) {
            comp = completions[_i];
            if (comp.caption !== 'var') {
              _results.push(comp);
            }
          }
          return _results;
        })();
        for (_i = 0, _len = completions.length; _i < _len; _i++) {
          suggestion = completions[_i];
          suggestion.score = fuzzaldrin.score(suggestion.value, word);
        }
        return callback(null, completions);
      }
    };
  };

  checkToken = function(token) {
    var check, result;
    check = function(parameter) {
      return (token.type.indexOf(parameter)) === 0;
    };
    result = check('constant') && !check('constant.numeric');
    result = result || check('identifier');
    result = result || check('variable');
    result = result || check('keyword');
    result = result || check('storage');
    return result;
  };

}).call(this);

},{"fuzzaldrin":8}],4:[function(require,module,exports){
(function() {
  var defaults;

  module.exports = defaults = {
    autoLineEndings: {},
    basic: true,
    snippetsLangDefaults: true,
    liveCompletion: true,
    language: 'javascript',
    languagePrefixes: 'this.,@,self.',
    completers: {
      keywords: true,
      snippets: true,
      text: true
    }
  };

}).call(this);

},{}],5:[function(require,module,exports){
(function() {
  var tv4;

  tv4 = require('tv4/tv4').tv4;

  module.exports = function(options) {
    return tv4.validateMultiple(options, {
      "type": "object",
      additionalProperties: false,
      properties: {
        autoLineEndings: {
          type: 'object',
          required: false,
          description: "Mapping ace mode language to line endings to automatically insert.  E.g. javacscript: ';'"
        },
        basic: {
          type: 'boolean',
          required: false,
          description: 'Basic autocompletion based on keywords used in code'
        },
        snippets: {
          type: 'boolean',
          required: false,
          description: 'Offers code snippets for autocomplete'
        },
        snippetsLangDefaults: {
          type: 'boolean',
          required: false,
          description: 'If true, use language default snippets'
        },
        liveCompletion: {
          type: 'boolean',
          required: false,
          description: 'Triggers autocomplete while typing'
        },
        language: {
          type: 'string',
          required: false,
          description: 'Language to load default snippets'
        },
        languagePrefixes: {
          type: 'string',
          required: false,
          description: 'Language prefixes that should be removed for snippets'
        },
        completers: {
          type: 'object',
          additionalProperties: false,
          properties: {
            snippets: {
              type: 'boolean',
              required: false,
              description: 'Show snippets suggestions in autocomplete popup'
            },
            keywords: {
              type: 'boolean',
              required: false,
              description: 'Show keywords suggestions in autocomplete popup'
            },
            text: {
              type: 'boolean',
              required: false,
              description: 'Show text content suggestions in autocomplete popup'
            }
          }
        },
        popupFontSizePx: {
          type: 'number',
          required: false,
          description: 'Font-size in pixels for popup text'
        },
        popupWidthPx: {
          type: 'number',
          required: false,
          description: 'Width in pixels for popup'
        }
      }
    });
  };

}).call(this);

},{"tv4/tv4":13}],6:[function(require,module,exports){
(function() {
  var Zatanna, defaults, optionsValidator,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  defaults = require('./defaults');

  optionsValidator = require('./validators/options');

  module.exports = Zatanna = (function() {
    var BackgroundTokenizer, Tokenizer;

    Tokenizer = '';

    BackgroundTokenizer = '';

    function Zatanna(aceEditor, options) {
      this.doLiveCompletion = __bind(this.doLiveCompletion, this);
      var config, defaultsCopy, validationResult;
      Tokenizer = ace.require('ace/tokenizer').Tokenizer;
      BackgroundTokenizer = ace.require('ace/background_tokenizer').BackgroundTokenizer;
      this.editor = aceEditor;
      config = ace.require('ace/config');
      if (options == null) {
        options = {};
      }
      defaultsCopy = _.extend({}, defaults);
      this.options = _.merge(defaultsCopy, options);
      validationResult = optionsValidator(this.options);
      if (!validationResult.valid) {
        throw new Error("Invalid Zatanna options: " + JSON.stringify(validationResult.errors, null, 4));
      }
      ace.config.loadModule('ace/ext/language_tools', (function(_this) {
        return function() {
          var aceDocument, highlightRules, tokenizer;
          _this.snippetManager = ace.require('ace/snippets').snippetManager;
          _this.snippetManager.expandWithTab = function() {
            return false;
          };
          highlightRules = new (_this.editor.getSession().getMode().HighlightRules)();
          tokenizer = new Tokenizer(highlightRules.getRules());
          _this.bgTokenizer = new BackgroundTokenizer(tokenizer, _this.editor);
          aceDocument = _this.editor.getSession().getDocument();
          _this.bgTokenizer.setDocument(aceDocument);
          _this.bgTokenizer.start(0);
          _this.setAceOptions();
          _this.copyCompleters();
          _this.activateCompleter();
          return _this.editor.commands.on('afterExec', _this.doLiveCompletion);
        };
      })(this));
    }

    Zatanna.prototype.setAceOptions = function() {
      var aceOptions, _ref;
      aceOptions = {
        'enableLiveAutocompletion': this.options.liveCompletion,
        'enableBasicAutocompletion': this.options.basic,
        'enableSnippets': this.options.completers.snippets
      };
      this.editor.setOptions(aceOptions);
      return (_ref = this.editor.completer) != null ? _ref.autoSelect = true : void 0;
    };

    Zatanna.prototype.copyCompleters = function() {
      var _ref;
      this.completers = {
        snippets: {},
        text: {},
        keywords: {}
      };
      if (this.editor.completers != null) {
        _ref = this.editor.completers, this.completers.snippets.comp = _ref[0], this.completers.text.comp = _ref[1], this.completers.keywords.comp = _ref[2];
      }
      if (this.options.completers.snippets) {
        this.completers.snippets = {
          pos: 0
        };
        this.completers.snippets.comp = require('./completers/snippets')(this.snippetManager, this.options.autoLineEndings);
      }
      if (this.options.completers.text) {
        this.completers.text = {
          pos: 1
        };
        this.completers.text.comp = require('./completers/text')(this.editor, this.bgTokenizer, this.completers.snippets.comp);
      }
      if (this.options.completers.keywords) {
        return this.completers.keywords = {
          pos: 2
        };
      }
    };

    Zatanna.prototype.activateCompleter = function(comp) {
      var comparator, type, _ref, _results;
      if (Array.isArray(comp)) {
        return this.editor.completers = comp;
      } else if (typeof comp === 'string') {
        if ((this.completers[comp] != null) && this.editor.completers[this.completers[comp].pos] !== this.completers[comp].comp) {
          return this.editor.completers.splice(this.completers[comp].pos, 0, this.completers[comp].comp);
        }
      } else {
        this.editor.completers = [];
        _ref = this.completers;
        _results = [];
        for (type in _ref) {
          comparator = _ref[type];
          if (this.options.completers[type] === true) {
            _results.push(this.activateCompleter(type));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    Zatanna.prototype.addSnippets = function(snippets, language) {
      this.options.language = language;
      return ace.config.loadModule('ace/ext/language_tools', (function(_this) {
        return function() {
          var snippetModulePath;
          _this.snippetManager = ace.require('ace/snippets').snippetManager;
          snippetModulePath = 'ace/snippets/' + language;
          return ace.config.loadModule(snippetModulePath, function(m) {
            var s, _i, _len, _ref;
            if (m != null) {
              _this.snippetManager.files[language] = m;
              if (((_ref = m.snippets) != null ? _ref.length : void 0) > 0) {
                _this.snippetManager.unregister(m.snippets);
              }
              if (_this.oldSnippets != null) {
                _this.snippetManager.unregister(_this.oldSnippets);
              }
              m.snippets = _this.options.snippetsLangDefaults ? _this.snippetManager.parseSnippetFile(m.snippetText) : [];
              for (_i = 0, _len = snippets.length; _i < _len; _i++) {
                s = snippets[_i];
                m.snippets.push(s);
              }
              _this.snippetManager.register(m.snippets);
              return _this.oldSnippets = m.snippets;
            }
          });
        };
      })(this));
    };

    Zatanna.prototype.setLiveCompletion = function(val) {
      if (val === true || val === false) {
        this.options.liveCompletion = val;
        return this.setAceOptions();
      }
    };

    Zatanna.prototype.set = function(setting, value) {
      switch (setting) {
        case 'snippets' || 'completers.snippets':
          if (typeof value !== 'boolean') {
            return;
          }
          this.options.completers.snippets = value;
          this.setAceOptions();
          this.activateCompleter('snippets');
          break;
        case 'basic':
          if (typeof value !== 'boolean') {
            return;
          }
          this.options.basic = value;
          this.setAceOptions();
          this.activateCompleter();
          break;
        case 'liveCompletion':
          if (typeof value !== 'boolean') {
            return;
          }
          this.options.liveCompletion = value;
          this.setAceOptions();
          this.activateCompleter();
          break;
        case 'language':
          if (typeof value !== 'string') {
            return;
          }
          this.options.language = value;
          this.setAceOptions();
          this.activateCompleter();
          break;
        case 'completers.keywords':
          if (typeof value !== 'boolean') {
            return;
          }
          this.options.completers.keywords = value;
          this.activateCompleter();
          break;
        case 'completers.text':
          if (typeof value !== 'boolean') {
            return;
          }
          this.options.completers.text = value;
          this.activateCompleter();
      }
    };

    Zatanna.prototype.on = function() {
      return this.paused = false;
    };

    Zatanna.prototype.off = function() {
      return this.paused = true;
    };

    Zatanna.prototype.doLiveCompletion = function(e) {
      var Autocomplete, TokenIterator, editor, exitAndReturn, hasCompleter, pos, prefix, text, token, _base, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
      if (!(this.options.basic || this.options.liveCompletion || this.options.completers.snippets || this.options.completers.text)) {
        return;
      }
      if (this.paused) {
        return;
      }
      TokenIterator = TokenIterator || ace.require('ace/token_iterator').TokenIterator;
      editor = e.editor;
      text = e.args || "";
      hasCompleter = editor.completer && editor.completer.activated;
      if (e.command.name === "backspace") {
        if (hasCompleter && !this.getCompletionPrefix(editor)) {
          if ((_ref = editor.completer) != null) {
            _ref.detach();
          }
        }
      } else if (e.command.name === "insertstring") {
        pos = editor.getCursorPosition();
        token = (new TokenIterator(editor.getSession(), pos.row, pos.column)).getCurrentToken();
        if ((token != null) && ((_ref1 = token.type) !== 'comment' && _ref1 !== 'string')) {
          prefix = this.getCompletionPrefix(editor);
          if (prefix && !hasCompleter) {
            if (!editor.completer) {
              Autocomplete = ace.require('ace/autocomplete').Autocomplete;
              if ((Autocomplete != null ? (_ref2 = Autocomplete.prototype) != null ? _ref2.commands : void 0 : void 0) != null) {
                exitAndReturn = (function(_this) {
                  return function(editor) {
                    editor.completer.detach();
                    return _this.editor.insert("\n");
                  };
                })(this);
                Autocomplete.prototype.commands["Shift-Return"] = exitAndReturn;
              }
              editor.completer = new Autocomplete();
            }
            editor.completer.autoSelect = true;
            editor.completer.autoInsert = false;
            editor.completer.showPopup(editor);
            if (((_ref3 = editor.completer) != null ? (_ref4 = _ref3.completions) != null ? (_ref5 = _ref4.filtered) != null ? _ref5.length : void 0 : void 0 : void 0) > 10) {
              editor.completer.detach();
            } else if (editor.completer.popup != null) {
              $('.ace_autocomplete').find('.ace_content').css('cursor', 'pointer');
              if (this.options.popupFontSizePx != null) {
                $('.ace_autocomplete').css('font-size', this.options.popupFontSizePx + 'px');
              }
              if (this.options.popupWidthPx != null) {
                $('.ace_autocomplete').css('width', this.options.popupWidthPx + 'px');
              }
              if (typeof (_base = editor.completer.popup).resize === "function") {
                _base.resize();
              }
            }
          }
        }
      }
      if (this.options.completers.text && ((_ref6 = e.command.name) === 'backspace' || _ref6 === 'del' || _ref6 === 'insertstring' || _ref6 === 'removetolinestart' || _ref6 === 'Enter' || _ref6 === 'Return' || _ref6 === 'Space' || _ref6 === 'Tab')) {
        return this.bgTokenizer.fireUpdateEvent(0, this.editor.getSession().getLength());
      }
    };

    Zatanna.prototype.getCompletionPrefix = function(editor) {
      var line, pos, prefix, util, _ref;
      util = util || ace.require('ace/autocomplete/util');
      pos = editor.getCursorPosition();
      line = editor.session.getLine(pos.row);
      prefix = null;
      if ((_ref = editor.completers) != null) {
        _ref.forEach(function(completer) {
          if (completer != null ? completer.identifierRegexps : void 0) {
            return completer.identifierRegexps.forEach(function(identifierRegex) {
              if (!prefix && identifierRegex) {
                return prefix = util.retrievePrecedingIdentifier(line, pos.column, identifierRegex);
              }
            });
          }
        });
      }
      if (prefix == null) {
        prefix = util.retrievePrecedingIdentifier(line, pos.column);
      }
      return prefix;
    };

    return Zatanna;

  })();

  if (typeof self !== "undefined" && self !== null) {
    self.Zatanna = Zatanna;
  }

  if (typeof window !== "undefined" && window !== null) {
    window.Zatanna = Zatanna;
  }

}).call(this);

},{"./completers/snippets":2,"./completers/text":3,"./defaults":4,"./validators/options":5}],7:[function(require,module,exports){
(function() {
  var pluckCandidates, scorer, sortCandidates;

  scorer = require('./scorer');

  pluckCandidates = function(a) {
    return a.candidate;
  };

  sortCandidates = function(a, b) {
    return b.score - a.score;
  };

  module.exports = function(candidates, query, queryHasSlashes, _arg) {
    var candidate, key, maxResults, score, scoredCandidates, string, _i, _len, _ref;
    _ref = _arg != null ? _arg : {}, key = _ref.key, maxResults = _ref.maxResults;
    if (query) {
      scoredCandidates = [];
      for (_i = 0, _len = candidates.length; _i < _len; _i++) {
        candidate = candidates[_i];
        string = key != null ? candidate[key] : candidate;
        if (!string) {
          continue;
        }
        score = scorer.score(string, query, queryHasSlashes);
        if (!queryHasSlashes) {
          score = scorer.basenameScore(string, query, score);
        }
        if (score > 0) {
          scoredCandidates.push({
            candidate: candidate,
            score: score
          });
        }
      }
      scoredCandidates.sort(sortCandidates);
      candidates = scoredCandidates.map(pluckCandidates);
    }
    if (maxResults != null) {
      candidates = candidates.slice(0, maxResults);
    }
    return candidates;
  };

}).call(this);

},{"./scorer":10}],8:[function(require,module,exports){
(function() {
  var PathSeparator, SpaceRegex, filter, matcher, scorer;

  scorer = require('./scorer');

  filter = require('./filter');

  matcher = require('./matcher');

  PathSeparator = require('path').sep;

  SpaceRegex = /\ /g;

  module.exports = {
    filter: function(candidates, query, options) {
      var queryHasSlashes;
      if (query) {
        queryHasSlashes = query.indexOf(PathSeparator) !== -1;
        query = query.replace(SpaceRegex, '');
      }
      return filter(candidates, query, queryHasSlashes, options);
    },
    score: function(string, query) {
      var queryHasSlashes, score;
      if (!string) {
        return 0;
      }
      if (!query) {
        return 0;
      }
      if (string === query) {
        return 2;
      }
      queryHasSlashes = query.indexOf(PathSeparator) !== -1;
      query = query.replace(SpaceRegex, '');
      score = scorer.score(string, query);
      if (!queryHasSlashes) {
        score = scorer.basenameScore(string, query, score);
      }
      return score;
    },
    match: function(string, query) {
      var baseMatches, index, matches, queryHasSlashes, seen, _i, _ref, _results;
      if (!string) {
        return [];
      }
      if (!query) {
        return [];
      }
      if (string === query) {
        return (function() {
          _results = [];
          for (var _i = 0, _ref = string.length; 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this);
      }
      queryHasSlashes = query.indexOf(PathSeparator) !== -1;
      query = query.replace(SpaceRegex, '');
      matches = matcher.match(string, query);
      if (!queryHasSlashes) {
        baseMatches = matcher.basenameMatch(string, query);
        matches = matches.concat(baseMatches).sort(function(a, b) {
          return a - b;
        });
        seen = null;
        index = 0;
        while (index < matches.length) {
          if (index && seen === matches[index]) {
            matches.splice(index, 1);
          } else {
            seen = matches[index];
            index++;
          }
        }
      }
      return matches;
    }
  };

}).call(this);

},{"./filter":7,"./matcher":9,"./scorer":10,"path":11}],9:[function(require,module,exports){
(function() {
  var PathSeparator;

  PathSeparator = require('path').sep;

  exports.basenameMatch = function(string, query) {
    var base, index, lastCharacter, slashCount;
    index = string.length - 1;
    while (string[index] === PathSeparator) {
      index--;
    }
    slashCount = 0;
    lastCharacter = index;
    base = null;
    while (index >= 0) {
      if (string[index] === PathSeparator) {
        slashCount++;
        if (base == null) {
          base = string.substring(index + 1, lastCharacter + 1);
        }
      } else if (index === 0) {
        if (lastCharacter < string.length - 1) {
          if (base == null) {
            base = string.substring(0, lastCharacter + 1);
          }
        } else {
          if (base == null) {
            base = string;
          }
        }
      }
      index--;
    }
    return exports.match(base, query, string.length - base.length);
  };

  exports.match = function(string, query, stringOffset) {
    var character, indexInQuery, indexInString, lowerCaseIndex, matches, minIndex, queryLength, stringLength, upperCaseIndex, _i, _ref, _results;
    if (stringOffset == null) {
      stringOffset = 0;
    }
    if (string === query) {
      return (function() {
        _results = [];
        for (var _i = stringOffset, _ref = stringOffset + string.length; stringOffset <= _ref ? _i < _ref : _i > _ref; stringOffset <= _ref ? _i++ : _i--){ _results.push(_i); }
        return _results;
      }).apply(this);
    }
    queryLength = query.length;
    stringLength = string.length;
    indexInQuery = 0;
    indexInString = 0;
    matches = [];
    while (indexInQuery < queryLength) {
      character = query[indexInQuery++];
      lowerCaseIndex = string.indexOf(character.toLowerCase());
      upperCaseIndex = string.indexOf(character.toUpperCase());
      minIndex = Math.min(lowerCaseIndex, upperCaseIndex);
      if (minIndex === -1) {
        minIndex = Math.max(lowerCaseIndex, upperCaseIndex);
      }
      indexInString = minIndex;
      if (indexInString === -1) {
        return [];
      }
      matches.push(stringOffset + indexInString);
      stringOffset += indexInString + 1;
      string = string.substring(indexInString + 1, stringLength);
    }
    return matches;
  };

}).call(this);

},{"path":11}],10:[function(require,module,exports){
(function() {
  var PathSeparator, queryIsLastPathSegment;

  PathSeparator = require('path').sep;

  exports.basenameScore = function(string, query, score) {
    var base, depth, index, lastCharacter, segmentCount, slashCount;
    index = string.length - 1;
    while (string[index] === PathSeparator) {
      index--;
    }
    slashCount = 0;
    lastCharacter = index;
    base = null;
    while (index >= 0) {
      if (string[index] === PathSeparator) {
        slashCount++;
        if (base == null) {
          base = string.substring(index + 1, lastCharacter + 1);
        }
      } else if (index === 0) {
        if (lastCharacter < string.length - 1) {
          if (base == null) {
            base = string.substring(0, lastCharacter + 1);
          }
        } else {
          if (base == null) {
            base = string;
          }
        }
      }
      index--;
    }
    if (base === string) {
      score *= 2;
    } else if (base) {
      score += exports.score(base, query);
    }
    segmentCount = slashCount + 1;
    depth = Math.max(1, 10 - segmentCount);
    score *= depth * 0.01;
    return score;
  };

  exports.score = function(string, query) {
    var character, characterScore, indexInQuery, indexInString, lowerCaseIndex, minIndex, queryLength, queryScore, stringLength, totalCharacterScore, upperCaseIndex, _ref;
    if (string === query) {
      return 1;
    }
    if (queryIsLastPathSegment(string, query)) {
      return 1;
    }
    totalCharacterScore = 0;
    queryLength = query.length;
    stringLength = string.length;
    indexInQuery = 0;
    indexInString = 0;
    while (indexInQuery < queryLength) {
      character = query[indexInQuery++];
      lowerCaseIndex = string.indexOf(character.toLowerCase());
      upperCaseIndex = string.indexOf(character.toUpperCase());
      minIndex = Math.min(lowerCaseIndex, upperCaseIndex);
      if (minIndex === -1) {
        minIndex = Math.max(lowerCaseIndex, upperCaseIndex);
      }
      indexInString = minIndex;
      if (indexInString === -1) {
        return 0;
      }
      characterScore = 0.1;
      if (string[indexInString] === character) {
        characterScore += 0.1;
      }
      if (indexInString === 0 || string[indexInString - 1] === PathSeparator) {
        characterScore += 0.8;
      } else if ((_ref = string[indexInString - 1]) === '-' || _ref === '_' || _ref === ' ') {
        characterScore += 0.7;
      }
      string = string.substring(indexInString + 1, stringLength);
      totalCharacterScore += characterScore;
    }
    queryScore = totalCharacterScore / queryLength;
    return ((queryScore * (queryLength / stringLength)) + queryScore) / 2;
  };

  queryIsLastPathSegment = function(string, query) {
    if (string[string.length - query.length - 1] === PathSeparator) {
      return string.lastIndexOf(query) === string.length - query.length;
    }
  };

}).call(this);

},{"path":11}],11:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require("JkpR2F"))
},{"JkpR2F":12}],12:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],13:[function(require,module,exports){
/*
Author: Geraint Luff and others
Year: 2013

This code is released into the "public domain" by its author(s).  Anybody may use, alter and distribute the code without restriction.  The author makes no guarantees, and takes no liability of any kind for use of this code.

If you find a bug or make an improvement, it would be courteous to let the author know, but it is not compulsory.
*/
(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module !== 'undefined' && module.exports){
    // CommonJS. Define export.
    module.exports = factory();
  } else {
    // Browser globals
    global.tv4 = factory();
  }
}(this, function () {

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FObject%2Fkeys
if (!Object.keys) {
	Object.keys = (function () {
		var hasOwnProperty = Object.prototype.hasOwnProperty,
			hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
			dontEnums = [
				'toString',
				'toLocaleString',
				'valueOf',
				'hasOwnProperty',
				'isPrototypeOf',
				'propertyIsEnumerable',
				'constructor'
			],
			dontEnumsLength = dontEnums.length;

		return function (obj) {
			if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) {
				throw new TypeError('Object.keys called on non-object');
			}

			var result = [];

			for (var prop in obj) {
				if (hasOwnProperty.call(obj, prop)) {
					result.push(prop);
				}
			}

			if (hasDontEnumBug) {
				for (var i=0; i < dontEnumsLength; i++) {
					if (hasOwnProperty.call(obj, dontEnums[i])) {
						result.push(dontEnums[i]);
					}
				}
			}
			return result;
		};
	})();
}
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
if (!Object.create) {
	Object.create = (function(){
		function F(){}

		return function(o){
			if (arguments.length !== 1) {
				throw new Error('Object.create implementation only accepts one parameter.');
			}
			F.prototype = o;
			return new F();
		};
	})();
}
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FArray%2FisArray
if(!Array.isArray) {
	Array.isArray = function (vArg) {
		return Object.prototype.toString.call(vArg) === "[object Array]";
	};
}
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FArray%2FindexOf
if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
		if (this === null) {
			throw new TypeError();
		}
		var t = Object(this);
		var len = t.length >>> 0;

		if (len === 0) {
			return -1;
		}
		var n = 0;
		if (arguments.length > 1) {
			n = Number(arguments[1]);
			if (n !== n) { // shortcut for verifying if it's NaN
				n = 0;
			} else if (n !== 0 && n !== Infinity && n !== -Infinity) {
				n = (n > 0 || -1) * Math.floor(Math.abs(n));
			}
		}
		if (n >= len) {
			return -1;
		}
		var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
		for (; k < len; k++) {
			if (k in t && t[k] === searchElement) {
				return k;
			}
		}
		return -1;
	};
}

// Grungey Object.isFrozen hack
if (!Object.isFrozen) {
	Object.isFrozen = function (obj) {
		var key = "tv4_test_frozen_key";
		while (obj.hasOwnProperty(key)) {
			key += Math.random();
		}
		try {
			obj[key] = true;
			delete obj[key];
			return false;
		} catch (e) {
			return true;
		}
	};
}
// Based on: https://github.com/geraintluff/uri-templates, but with all the de-substitution stuff removed

var uriTemplateGlobalModifiers = {
	"+": true,
	"#": true,
	".": true,
	"/": true,
	";": true,
	"?": true,
	"&": true
};
var uriTemplateSuffices = {
	"*": true
};

function notReallyPercentEncode(string) {
	return encodeURI(string).replace(/%25[0-9][0-9]/g, function (doubleEncoded) {
		return "%" + doubleEncoded.substring(3);
	});
}

function uriTemplateSubstitution(spec) {
	var modifier = "";
	if (uriTemplateGlobalModifiers[spec.charAt(0)]) {
		modifier = spec.charAt(0);
		spec = spec.substring(1);
	}
	var separator = "";
	var prefix = "";
	var shouldEscape = true;
	var showVariables = false;
	var trimEmptyString = false;
	if (modifier === '+') {
		shouldEscape = false;
	} else if (modifier === ".") {
		prefix = ".";
		separator = ".";
	} else if (modifier === "/") {
		prefix = "/";
		separator = "/";
	} else if (modifier === '#') {
		prefix = "#";
		shouldEscape = false;
	} else if (modifier === ';') {
		prefix = ";";
		separator = ";";
		showVariables = true;
		trimEmptyString = true;
	} else if (modifier === '?') {
		prefix = "?";
		separator = "&";
		showVariables = true;
	} else if (modifier === '&') {
		prefix = "&";
		separator = "&";
		showVariables = true;
	}

	var varNames = [];
	var varList = spec.split(",");
	var varSpecs = [];
	var varSpecMap = {};
	for (var i = 0; i < varList.length; i++) {
		var varName = varList[i];
		var truncate = null;
		if (varName.indexOf(":") !== -1) {
			var parts = varName.split(":");
			varName = parts[0];
			truncate = parseInt(parts[1], 10);
		}
		var suffices = {};
		while (uriTemplateSuffices[varName.charAt(varName.length - 1)]) {
			suffices[varName.charAt(varName.length - 1)] = true;
			varName = varName.substring(0, varName.length - 1);
		}
		var varSpec = {
			truncate: truncate,
			name: varName,
			suffices: suffices
		};
		varSpecs.push(varSpec);
		varSpecMap[varName] = varSpec;
		varNames.push(varName);
	}
	var subFunction = function (valueFunction) {
		var result = "";
		var startIndex = 0;
		for (var i = 0; i < varSpecs.length; i++) {
			var varSpec = varSpecs[i];
			var value = valueFunction(varSpec.name);
			if (value === null || value === undefined || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0)) {
				startIndex++;
				continue;
			}
			if (i === startIndex) {
				result += prefix;
			} else {
				result += (separator || ",");
			}
			if (Array.isArray(value)) {
				if (showVariables) {
					result += varSpec.name + "=";
				}
				for (var j = 0; j < value.length; j++) {
					if (j > 0) {
						result += varSpec.suffices['*'] ? (separator || ",") : ",";
						if (varSpec.suffices['*'] && showVariables) {
							result += varSpec.name + "=";
						}
					}
					result += shouldEscape ? encodeURIComponent(value[j]).replace(/!/g, "%21") : notReallyPercentEncode(value[j]);
				}
			} else if (typeof value === "object") {
				if (showVariables && !varSpec.suffices['*']) {
					result += varSpec.name + "=";
				}
				var first = true;
				for (var key in value) {
					if (!first) {
						result += varSpec.suffices['*'] ? (separator || ",") : ",";
					}
					first = false;
					result += shouldEscape ? encodeURIComponent(key).replace(/!/g, "%21") : notReallyPercentEncode(key);
					result += varSpec.suffices['*'] ? '=' : ",";
					result += shouldEscape ? encodeURIComponent(value[key]).replace(/!/g, "%21") : notReallyPercentEncode(value[key]);
				}
			} else {
				if (showVariables) {
					result += varSpec.name;
					if (!trimEmptyString || value !== "") {
						result += "=";
					}
				}
				if (varSpec.truncate != null) {
					value = value.substring(0, varSpec.truncate);
				}
				result += shouldEscape ? encodeURIComponent(value).replace(/!/g, "%21"): notReallyPercentEncode(value);
			}
		}
		return result;
	};
	subFunction.varNames = varNames;
	return {
		prefix: prefix,
		substitution: subFunction
	};
}

function UriTemplate(template) {
	if (!(this instanceof UriTemplate)) {
		return new UriTemplate(template);
	}
	var parts = template.split("{");
	var textParts = [parts.shift()];
	var prefixes = [];
	var substitutions = [];
	var varNames = [];
	while (parts.length > 0) {
		var part = parts.shift();
		var spec = part.split("}")[0];
		var remainder = part.substring(spec.length + 1);
		var funcs = uriTemplateSubstitution(spec);
		substitutions.push(funcs.substitution);
		prefixes.push(funcs.prefix);
		textParts.push(remainder);
		varNames = varNames.concat(funcs.substitution.varNames);
	}
	this.fill = function (valueFunction) {
		var result = textParts[0];
		for (var i = 0; i < substitutions.length; i++) {
			var substitution = substitutions[i];
			result += substitution(valueFunction);
			result += textParts[i + 1];
		}
		return result;
	};
	this.varNames = varNames;
	this.template = template;
}
UriTemplate.prototype = {
	toString: function () {
		return this.template;
	},
	fillFromObject: function (obj) {
		return this.fill(function (varName) {
			return obj[varName];
		});
	}
};
var ValidatorContext = function ValidatorContext(parent, collectMultiple, errorMessages, checkRecursive, trackUnknownProperties) {
	this.missing = [];
	this.missingMap = {};
	this.formatValidators = parent ? Object.create(parent.formatValidators) : {};
	this.schemas = parent ? Object.create(parent.schemas) : {};
	this.collectMultiple = collectMultiple;
	this.errors = [];
	this.handleError = collectMultiple ? this.collectError : this.returnError;
	if (checkRecursive) {
		this.checkRecursive = true;
		this.scanned = [];
		this.scannedFrozen = [];
		this.scannedFrozenSchemas = [];
		this.scannedFrozenValidationErrors = [];
		this.validatedSchemasKey = 'tv4_validation_id';
		this.validationErrorsKey = 'tv4_validation_errors_id';
	}
	if (trackUnknownProperties) {
		this.trackUnknownProperties = true;
		this.knownPropertyPaths = {};
		this.unknownPropertyPaths = {};
	}
	this.errorMessages = errorMessages;
	this.definedKeywords = {};
	if (parent) {
		for (var key in parent.definedKeywords) {
			this.definedKeywords[key] = parent.definedKeywords[key].slice(0);
		}
	}
};
ValidatorContext.prototype.defineKeyword = function (keyword, keywordFunction) {
	this.definedKeywords[keyword] = this.definedKeywords[keyword] || [];
	this.definedKeywords[keyword].push(keywordFunction);
};
ValidatorContext.prototype.createError = function (code, messageParams, dataPath, schemaPath, subErrors) {
	var messageTemplate = this.errorMessages[code] || ErrorMessagesDefault[code];
	if (typeof messageTemplate !== 'string') {
		return new ValidationError(code, "Unknown error code " + code + ": " + JSON.stringify(messageParams), messageParams, dataPath, schemaPath, subErrors);
	}
	// Adapted from Crockford's supplant()
	var message = messageTemplate.replace(/\{([^{}]*)\}/g, function (whole, varName) {
		var subValue = messageParams[varName];
		return typeof subValue === 'string' || typeof subValue === 'number' ? subValue : whole;
	});
	return new ValidationError(code, message, messageParams, dataPath, schemaPath, subErrors);
};
ValidatorContext.prototype.returnError = function (error) {
	return error;
};
ValidatorContext.prototype.collectError = function (error) {
	if (error) {
		this.errors.push(error);
	}
	return null;
};
ValidatorContext.prototype.prefixErrors = function (startIndex, dataPath, schemaPath) {
	for (var i = startIndex; i < this.errors.length; i++) {
		this.errors[i] = this.errors[i].prefixWith(dataPath, schemaPath);
	}
	return this;
};
ValidatorContext.prototype.banUnknownProperties = function () {
	for (var unknownPath in this.unknownPropertyPaths) {
		var error = this.createError(ErrorCodes.UNKNOWN_PROPERTY, {path: unknownPath}, unknownPath, "");
		var result = this.handleError(error);
		if (result) {
			return result;
		}
	}
	return null;
};

ValidatorContext.prototype.addFormat = function (format, validator) {
	if (typeof format === 'object') {
		for (var key in format) {
			this.addFormat(key, format[key]);
		}
		return this;
	}
	this.formatValidators[format] = validator;
};
ValidatorContext.prototype.resolveRefs = function (schema, urlHistory) {
	if (schema['$ref'] !== undefined) {
		urlHistory = urlHistory || {};
		if (urlHistory[schema['$ref']]) {
			return this.createError(ErrorCodes.CIRCULAR_REFERENCE, {urls: Object.keys(urlHistory).join(', ')}, '', '');
		}
		urlHistory[schema['$ref']] = true;
		schema = this.getSchema(schema['$ref'], urlHistory);
	}
	return schema;
};
ValidatorContext.prototype.getSchema = function (url, urlHistory) {
	var schema;
	if (this.schemas[url] !== undefined) {
		schema = this.schemas[url];
		return this.resolveRefs(schema, urlHistory);
	}
	var baseUrl = url;
	var fragment = "";
	if (url.indexOf('#') !== -1) {
		fragment = url.substring(url.indexOf("#") + 1);
		baseUrl = url.substring(0, url.indexOf("#"));
	}
	if (typeof this.schemas[baseUrl] === 'object') {
		schema = this.schemas[baseUrl];
		var pointerPath = decodeURIComponent(fragment);
		if (pointerPath === "") {
			return this.resolveRefs(schema, urlHistory);
		} else if (pointerPath.charAt(0) !== "/") {
			return undefined;
		}
		var parts = pointerPath.split("/").slice(1);
		for (var i = 0; i < parts.length; i++) {
			var component = parts[i].replace(/~1/g, "/").replace(/~0/g, "~");
			if (schema[component] === undefined) {
				schema = undefined;
				break;
			}
			schema = schema[component];
		}
		if (schema !== undefined) {
			return this.resolveRefs(schema, urlHistory);
		}
	}
	if (this.missing[baseUrl] === undefined) {
		this.missing.push(baseUrl);
		this.missing[baseUrl] = baseUrl;
		this.missingMap[baseUrl] = baseUrl;
	}
};
ValidatorContext.prototype.searchSchemas = function (schema, url) {
	if (schema && typeof schema === "object") {
		if (typeof schema.id === "string") {
			if (isTrustedUrl(url, schema.id)) {
				if (this.schemas[schema.id] === undefined) {
					this.schemas[schema.id] = schema;
				}
			}
		}
		for (var key in schema) {
			if (key !== "enum") {
				if (typeof schema[key] === "object") {
					this.searchSchemas(schema[key], url);
				} else if (key === "$ref") {
					var uri = getDocumentUri(schema[key]);
					if (uri && this.schemas[uri] === undefined && this.missingMap[uri] === undefined) {
						this.missingMap[uri] = uri;
					}
				}
			}
		}
	}
};
ValidatorContext.prototype.addSchema = function (url, schema) {
	//overload
	if (typeof url !== 'string' || typeof schema === 'undefined') {
		if (typeof url === 'object' && typeof url.id === 'string') {
			schema = url;
			url = schema.id;
		}
		else {
			return;
		}
	}
	if (url === getDocumentUri(url) + "#") {
		// Remove empty fragment
		url = getDocumentUri(url);
	}
	this.schemas[url] = schema;
	delete this.missingMap[url];
	normSchema(schema, url);
	this.searchSchemas(schema, url);
};

ValidatorContext.prototype.getSchemaMap = function () {
	var map = {};
	for (var key in this.schemas) {
		map[key] = this.schemas[key];
	}
	return map;
};

ValidatorContext.prototype.getSchemaUris = function (filterRegExp) {
	var list = [];
	for (var key in this.schemas) {
		if (!filterRegExp || filterRegExp.test(key)) {
			list.push(key);
		}
	}
	return list;
};

ValidatorContext.prototype.getMissingUris = function (filterRegExp) {
	var list = [];
	for (var key in this.missingMap) {
		if (!filterRegExp || filterRegExp.test(key)) {
			list.push(key);
		}
	}
	return list;
};

ValidatorContext.prototype.dropSchemas = function () {
	this.schemas = {};
	this.reset();
};
ValidatorContext.prototype.reset = function () {
	this.missing = [];
	this.missingMap = {};
	this.errors = [];
};

ValidatorContext.prototype.validateAll = function (data, schema, dataPathParts, schemaPathParts, dataPointerPath) {
	var topLevel;
	schema = this.resolveRefs(schema);
	if (!schema) {
		return null;
	} else if (schema instanceof ValidationError) {
		this.errors.push(schema);
		return schema;
	}

	var startErrorCount = this.errors.length;
	var frozenIndex, scannedFrozenSchemaIndex = null, scannedSchemasIndex = null;
	if (this.checkRecursive && data && typeof data === 'object') {
		topLevel = !this.scanned.length;
		if (data[this.validatedSchemasKey]) {
			var schemaIndex = data[this.validatedSchemasKey].indexOf(schema);
			if (schemaIndex !== -1) {
				this.errors = this.errors.concat(data[this.validationErrorsKey][schemaIndex]);
				return null;
			}
		}
		if (Object.isFrozen(data)) {
			frozenIndex = this.scannedFrozen.indexOf(data);
			if (frozenIndex !== -1) {
				var frozenSchemaIndex = this.scannedFrozenSchemas[frozenIndex].indexOf(schema);
				if (frozenSchemaIndex !== -1) {
					this.errors = this.errors.concat(this.scannedFrozenValidationErrors[frozenIndex][frozenSchemaIndex]);
					return null;
				}
			}
		}
		this.scanned.push(data);
		if (Object.isFrozen(data)) {
			if (frozenIndex === -1) {
				frozenIndex = this.scannedFrozen.length;
				this.scannedFrozen.push(data);
				this.scannedFrozenSchemas.push([]);
			}
			scannedFrozenSchemaIndex = this.scannedFrozenSchemas[frozenIndex].length;
			this.scannedFrozenSchemas[frozenIndex][scannedFrozenSchemaIndex] = schema;
			this.scannedFrozenValidationErrors[frozenIndex][scannedFrozenSchemaIndex] = [];
		} else {
			if (!data[this.validatedSchemasKey]) {
				try {
					Object.defineProperty(data, this.validatedSchemasKey, {
						value: [],
						configurable: true
					});
					Object.defineProperty(data, this.validationErrorsKey, {
						value: [],
						configurable: true
					});
				} catch (e) {
					//IE 7/8 workaround
					data[this.validatedSchemasKey] = [];
					data[this.validationErrorsKey] = [];
				}
			}
			scannedSchemasIndex = data[this.validatedSchemasKey].length;
			data[this.validatedSchemasKey][scannedSchemasIndex] = schema;
			data[this.validationErrorsKey][scannedSchemasIndex] = [];
		}
	}

	var errorCount = this.errors.length;
	var error = this.validateBasic(data, schema, dataPointerPath)
		|| this.validateNumeric(data, schema, dataPointerPath)
		|| this.validateString(data, schema, dataPointerPath)
		|| this.validateArray(data, schema, dataPointerPath)
		|| this.validateObject(data, schema, dataPointerPath)
		|| this.validateCombinations(data, schema, dataPointerPath)
		|| this.validateHypermedia(data, schema, dataPointerPath)
		|| this.validateFormat(data, schema, dataPointerPath)
		|| this.validateDefinedKeywords(data, schema, dataPointerPath)
		|| null;

	if (topLevel) {
		while (this.scanned.length) {
			var item = this.scanned.pop();
			delete item[this.validatedSchemasKey];
		}
		this.scannedFrozen = [];
		this.scannedFrozenSchemas = [];
	}

	if (error || errorCount !== this.errors.length) {
		while ((dataPathParts && dataPathParts.length) || (schemaPathParts && schemaPathParts.length)) {
			var dataPart = (dataPathParts && dataPathParts.length) ? "" + dataPathParts.pop() : null;
			var schemaPart = (schemaPathParts && schemaPathParts.length) ? "" + schemaPathParts.pop() : null;
			if (error) {
				error = error.prefixWith(dataPart, schemaPart);
			}
			this.prefixErrors(errorCount, dataPart, schemaPart);
		}
	}

	if (scannedFrozenSchemaIndex !== null) {
		this.scannedFrozenValidationErrors[frozenIndex][scannedFrozenSchemaIndex] = this.errors.slice(startErrorCount);
	} else if (scannedSchemasIndex !== null) {
		data[this.validationErrorsKey][scannedSchemasIndex] = this.errors.slice(startErrorCount);
	}

	return this.handleError(error);
};
ValidatorContext.prototype.validateFormat = function (data, schema) {
	if (typeof schema.format !== 'string' || !this.formatValidators[schema.format]) {
		return null;
	}
	var errorMessage = this.formatValidators[schema.format].call(null, data, schema);
	if (typeof errorMessage === 'string' || typeof errorMessage === 'number') {
		return this.createError(ErrorCodes.FORMAT_CUSTOM, {message: errorMessage}).prefixWith(null, "format");
	} else if (errorMessage && typeof errorMessage === 'object') {
		return this.createError(ErrorCodes.FORMAT_CUSTOM, {message: errorMessage.message || "?"}, errorMessage.dataPath || null, errorMessage.schemaPath || "/format");
	}
	return null;
};
ValidatorContext.prototype.validateDefinedKeywords = function (data, schema) {
	for (var key in this.definedKeywords) {
		if (typeof schema[key] === 'undefined') {
			continue;
		}
		var validationFunctions = this.definedKeywords[key];
		for (var i = 0; i < validationFunctions.length; i++) {
			var func = validationFunctions[i];
			var result = func(data, schema[key], schema);
			if (typeof result === 'string' || typeof result === 'number') {
				return this.createError(ErrorCodes.KEYWORD_CUSTOM, {key: key, message: result}).prefixWith(null, "format");
			} else if (result && typeof result === 'object') {
				var code = result.code || ErrorCodes.KEYWORD_CUSTOM;
				if (typeof code === 'string') {
					if (!ErrorCodes[code]) {
						throw new Error('Undefined error code (use defineError): ' + code);
					}
					code = ErrorCodes[code];
				}
				var messageParams = (typeof result.message === 'object') ? result.message : {key: key, message: result.message || "?"};
				var schemaPath = result.schemaPath ||( "/" + key.replace(/~/g, '~0').replace(/\//g, '~1'));
				return this.createError(code, messageParams, result.dataPath || null, schemaPath);
			}
		}
	}
	return null;
};

function recursiveCompare(A, B) {
	if (A === B) {
		return true;
	}
	if (typeof A === "object" && typeof B === "object") {
		if (Array.isArray(A) !== Array.isArray(B)) {
			return false;
		} else if (Array.isArray(A)) {
			if (A.length !== B.length) {
				return false;
			}
			for (var i = 0; i < A.length; i++) {
				if (!recursiveCompare(A[i], B[i])) {
					return false;
				}
			}
		} else {
			var key;
			for (key in A) {
				if (B[key] === undefined && A[key] !== undefined) {
					return false;
				}
			}
			for (key in B) {
				if (A[key] === undefined && B[key] !== undefined) {
					return false;
				}
			}
			for (key in A) {
				if (!recursiveCompare(A[key], B[key])) {
					return false;
				}
			}
		}
		return true;
	}
	return false;
}

ValidatorContext.prototype.validateBasic = function validateBasic(data, schema, dataPointerPath) {
	var error;
	if (error = this.validateType(data, schema, dataPointerPath)) {
		return error.prefixWith(null, "type");
	}
	if (error = this.validateEnum(data, schema, dataPointerPath)) {
		return error.prefixWith(null, "type");
	}
	return null;
};

ValidatorContext.prototype.validateType = function validateType(data, schema) {
	if (schema.type === undefined) {
		return null;
	}
	var dataType = typeof data;
	if (data === null) {
		dataType = "null";
	} else if (Array.isArray(data)) {
		dataType = "array";
	}
	var allowedTypes = schema.type;
	if (typeof allowedTypes !== "object") {
		allowedTypes = [allowedTypes];
	}

	for (var i = 0; i < allowedTypes.length; i++) {
		var type = allowedTypes[i];
		if (type === dataType || (type === "integer" && dataType === "number" && (data % 1 === 0))) {
			return null;
		}
	}
	return this.createError(ErrorCodes.INVALID_TYPE, {type: dataType, expected: allowedTypes.join("/")});
};

ValidatorContext.prototype.validateEnum = function validateEnum(data, schema) {
	if (schema["enum"] === undefined) {
		return null;
	}
	for (var i = 0; i < schema["enum"].length; i++) {
		var enumVal = schema["enum"][i];
		if (recursiveCompare(data, enumVal)) {
			return null;
		}
	}
	return this.createError(ErrorCodes.ENUM_MISMATCH, {value: (typeof JSON !== 'undefined') ? JSON.stringify(data) : data});
};

ValidatorContext.prototype.validateNumeric = function validateNumeric(data, schema, dataPointerPath) {
	return this.validateMultipleOf(data, schema, dataPointerPath)
		|| this.validateMinMax(data, schema, dataPointerPath)
		|| this.validateNaN(data, schema, dataPointerPath)
		|| null;
};

ValidatorContext.prototype.validateMultipleOf = function validateMultipleOf(data, schema) {
	var multipleOf = schema.multipleOf || schema.divisibleBy;
	if (multipleOf === undefined) {
		return null;
	}
	if (typeof data === "number") {
		if (data % multipleOf !== 0) {
			return this.createError(ErrorCodes.NUMBER_MULTIPLE_OF, {value: data, multipleOf: multipleOf});
		}
	}
	return null;
};

ValidatorContext.prototype.validateMinMax = function validateMinMax(data, schema) {
	if (typeof data !== "number") {
		return null;
	}
	if (schema.minimum !== undefined) {
		if (data < schema.minimum) {
			return this.createError(ErrorCodes.NUMBER_MINIMUM, {value: data, minimum: schema.minimum}).prefixWith(null, "minimum");
		}
		if (schema.exclusiveMinimum && data === schema.minimum) {
			return this.createError(ErrorCodes.NUMBER_MINIMUM_EXCLUSIVE, {value: data, minimum: schema.minimum}).prefixWith(null, "exclusiveMinimum");
		}
	}
	if (schema.maximum !== undefined) {
		if (data > schema.maximum) {
			return this.createError(ErrorCodes.NUMBER_MAXIMUM, {value: data, maximum: schema.maximum}).prefixWith(null, "maximum");
		}
		if (schema.exclusiveMaximum && data === schema.maximum) {
			return this.createError(ErrorCodes.NUMBER_MAXIMUM_EXCLUSIVE, {value: data, maximum: schema.maximum}).prefixWith(null, "exclusiveMaximum");
		}
	}
	return null;
};

ValidatorContext.prototype.validateNaN = function validateNaN(data) {
	if (typeof data !== "number") {
		return null;
	}
	if (isNaN(data) === true || data === Infinity || data === -Infinity) {
		return this.createError(ErrorCodes.NUMBER_NOT_A_NUMBER, {value: data}).prefixWith(null, "type");
	}
	return null;
};

ValidatorContext.prototype.validateString = function validateString(data, schema, dataPointerPath) {
	return this.validateStringLength(data, schema, dataPointerPath)
		|| this.validateStringPattern(data, schema, dataPointerPath)
		|| null;
};

ValidatorContext.prototype.validateStringLength = function validateStringLength(data, schema) {
	if (typeof data !== "string") {
		return null;
	}
	if (schema.minLength !== undefined) {
		if (data.length < schema.minLength) {
			return this.createError(ErrorCodes.STRING_LENGTH_SHORT, {length: data.length, minimum: schema.minLength}).prefixWith(null, "minLength");
		}
	}
	if (schema.maxLength !== undefined) {
		if (data.length > schema.maxLength) {
			return this.createError(ErrorCodes.STRING_LENGTH_LONG, {length: data.length, maximum: schema.maxLength}).prefixWith(null, "maxLength");
		}
	}
	return null;
};

ValidatorContext.prototype.validateStringPattern = function validateStringPattern(data, schema) {
	if (typeof data !== "string" || schema.pattern === undefined) {
		return null;
	}
	var regexp = new RegExp(schema.pattern);
	if (!regexp.test(data)) {
		return this.createError(ErrorCodes.STRING_PATTERN, {pattern: schema.pattern}).prefixWith(null, "pattern");
	}
	return null;
};
ValidatorContext.prototype.validateArray = function validateArray(data, schema, dataPointerPath) {
	if (!Array.isArray(data)) {
		return null;
	}
	return this.validateArrayLength(data, schema, dataPointerPath)
		|| this.validateArrayUniqueItems(data, schema, dataPointerPath)
		|| this.validateArrayItems(data, schema, dataPointerPath)
		|| null;
};

ValidatorContext.prototype.validateArrayLength = function validateArrayLength(data, schema) {
	var error;
	if (schema.minItems !== undefined) {
		if (data.length < schema.minItems) {
			error = (this.createError(ErrorCodes.ARRAY_LENGTH_SHORT, {length: data.length, minimum: schema.minItems})).prefixWith(null, "minItems");
			if (this.handleError(error)) {
				return error;
			}
		}
	}
	if (schema.maxItems !== undefined) {
		if (data.length > schema.maxItems) {
			error = (this.createError(ErrorCodes.ARRAY_LENGTH_LONG, {length: data.length, maximum: schema.maxItems})).prefixWith(null, "maxItems");
			if (this.handleError(error)) {
				return error;
			}
		}
	}
	return null;
};

ValidatorContext.prototype.validateArrayUniqueItems = function validateArrayUniqueItems(data, schema) {
	if (schema.uniqueItems) {
		for (var i = 0; i < data.length; i++) {
			for (var j = i + 1; j < data.length; j++) {
				if (recursiveCompare(data[i], data[j])) {
					var error = (this.createError(ErrorCodes.ARRAY_UNIQUE, {match1: i, match2: j})).prefixWith(null, "uniqueItems");
					if (this.handleError(error)) {
						return error;
					}
				}
			}
		}
	}
	return null;
};

ValidatorContext.prototype.validateArrayItems = function validateArrayItems(data, schema, dataPointerPath) {
	if (schema.items === undefined) {
		return null;
	}
	var error, i;
	if (Array.isArray(schema.items)) {
		for (i = 0; i < data.length; i++) {
			if (i < schema.items.length) {
				if (error = this.validateAll(data[i], schema.items[i], [i], ["items", i], dataPointerPath + "/" + i)) {
					return error;
				}
			} else if (schema.additionalItems !== undefined) {
				if (typeof schema.additionalItems === "boolean") {
					if (!schema.additionalItems) {
						error = (this.createError(ErrorCodes.ARRAY_ADDITIONAL_ITEMS, {})).prefixWith("" + i, "additionalItems");
						if (this.handleError(error)) {
							return error;
						}
					}
				} else if (error = this.validateAll(data[i], schema.additionalItems, [i], ["additionalItems"], dataPointerPath + "/" + i)) {
					return error;
				}
			}
		}
	} else {
		for (i = 0; i < data.length; i++) {
			if (error = this.validateAll(data[i], schema.items, [i], ["items"], dataPointerPath + "/" + i)) {
				return error;
			}
		}
	}
	return null;
};

ValidatorContext.prototype.validateObject = function validateObject(data, schema, dataPointerPath) {
	if (typeof data !== "object" || data === null || Array.isArray(data)) {
		return null;
	}
	return this.validateObjectMinMaxProperties(data, schema, dataPointerPath)
		|| this.validateObjectRequiredProperties(data, schema, dataPointerPath)
		|| this.validateObjectProperties(data, schema, dataPointerPath)
		|| this.validateObjectDependencies(data, schema, dataPointerPath)
		|| null;
};

ValidatorContext.prototype.validateObjectMinMaxProperties = function validateObjectMinMaxProperties(data, schema) {
	var keys = Object.keys(data);
	var error;
	if (schema.minProperties !== undefined) {
		if (keys.length < schema.minProperties) {
			error = this.createError(ErrorCodes.OBJECT_PROPERTIES_MINIMUM, {propertyCount: keys.length, minimum: schema.minProperties}).prefixWith(null, "minProperties");
			if (this.handleError(error)) {
				return error;
			}
		}
	}
	if (schema.maxProperties !== undefined) {
		if (keys.length > schema.maxProperties) {
			error = this.createError(ErrorCodes.OBJECT_PROPERTIES_MAXIMUM, {propertyCount: keys.length, maximum: schema.maxProperties}).prefixWith(null, "maxProperties");
			if (this.handleError(error)) {
				return error;
			}
		}
	}
	return null;
};

ValidatorContext.prototype.validateObjectRequiredProperties = function validateObjectRequiredProperties(data, schema) {
	if (schema.required !== undefined) {
		for (var i = 0; i < schema.required.length; i++) {
			var key = schema.required[i];
			if (data[key] === undefined) {
				var error = this.createError(ErrorCodes.OBJECT_REQUIRED, {key: key}).prefixWith(null, "" + i).prefixWith(null, "required");
				if (this.handleError(error)) {
					return error;
				}
			}
		}
	}
	return null;
};

ValidatorContext.prototype.validateObjectProperties = function validateObjectProperties(data, schema, dataPointerPath) {
	var error;
	for (var key in data) {
		var keyPointerPath = dataPointerPath + "/" + key.replace(/~/g, '~0').replace(/\//g, '~1');
		var foundMatch = false;
		if (schema.properties !== undefined && schema.properties[key] !== undefined) {
			foundMatch = true;
			if (error = this.validateAll(data[key], schema.properties[key], [key], ["properties", key], keyPointerPath)) {
				return error;
			}
		}
		if (schema.patternProperties !== undefined) {
			for (var patternKey in schema.patternProperties) {
				var regexp = new RegExp(patternKey);
				if (regexp.test(key)) {
					foundMatch = true;
					if (error = this.validateAll(data[key], schema.patternProperties[patternKey], [key], ["patternProperties", patternKey], keyPointerPath)) {
						return error;
					}
				}
			}
		}
		if (!foundMatch) {
			if (schema.additionalProperties !== undefined) {
				if (this.trackUnknownProperties) {
					this.knownPropertyPaths[keyPointerPath] = true;
					delete this.unknownPropertyPaths[keyPointerPath];
				}
				if (typeof schema.additionalProperties === "boolean") {
					if (!schema.additionalProperties) {
						error = this.createError(ErrorCodes.OBJECT_ADDITIONAL_PROPERTIES, {}).prefixWith(key, "additionalProperties");
						if (this.handleError(error)) {
							return error;
						}
					}
				} else {
					if (error = this.validateAll(data[key], schema.additionalProperties, [key], ["additionalProperties"], keyPointerPath)) {
						return error;
					}
				}
			} else if (this.trackUnknownProperties && !this.knownPropertyPaths[keyPointerPath]) {
				this.unknownPropertyPaths[keyPointerPath] = true;
			}
		} else if (this.trackUnknownProperties) {
			this.knownPropertyPaths[keyPointerPath] = true;
			delete this.unknownPropertyPaths[keyPointerPath];
		}
	}
	return null;
};

ValidatorContext.prototype.validateObjectDependencies = function validateObjectDependencies(data, schema, dataPointerPath) {
	var error;
	if (schema.dependencies !== undefined) {
		for (var depKey in schema.dependencies) {
			if (data[depKey] !== undefined) {
				var dep = schema.dependencies[depKey];
				if (typeof dep === "string") {
					if (data[dep] === undefined) {
						error = this.createError(ErrorCodes.OBJECT_DEPENDENCY_KEY, {key: depKey, missing: dep}).prefixWith(null, depKey).prefixWith(null, "dependencies");
						if (this.handleError(error)) {
							return error;
						}
					}
				} else if (Array.isArray(dep)) {
					for (var i = 0; i < dep.length; i++) {
						var requiredKey = dep[i];
						if (data[requiredKey] === undefined) {
							error = this.createError(ErrorCodes.OBJECT_DEPENDENCY_KEY, {key: depKey, missing: requiredKey}).prefixWith(null, "" + i).prefixWith(null, depKey).prefixWith(null, "dependencies");
							if (this.handleError(error)) {
								return error;
							}
						}
					}
				} else {
					if (error = this.validateAll(data, dep, [], ["dependencies", depKey], dataPointerPath)) {
						return error;
					}
				}
			}
		}
	}
	return null;
};

ValidatorContext.prototype.validateCombinations = function validateCombinations(data, schema, dataPointerPath) {
	return this.validateAllOf(data, schema, dataPointerPath)
		|| this.validateAnyOf(data, schema, dataPointerPath)
		|| this.validateOneOf(data, schema, dataPointerPath)
		|| this.validateNot(data, schema, dataPointerPath)
		|| null;
};

ValidatorContext.prototype.validateAllOf = function validateAllOf(data, schema, dataPointerPath) {
	if (schema.allOf === undefined) {
		return null;
	}
	var error;
	for (var i = 0; i < schema.allOf.length; i++) {
		var subSchema = schema.allOf[i];
		if (error = this.validateAll(data, subSchema, [], ["allOf", i], dataPointerPath)) {
			return error;
		}
	}
	return null;
};

ValidatorContext.prototype.validateAnyOf = function validateAnyOf(data, schema, dataPointerPath) {
	if (schema.anyOf === undefined) {
		return null;
	}
	var errors = [];
	var startErrorCount = this.errors.length;
	var oldUnknownPropertyPaths, oldKnownPropertyPaths;
	if (this.trackUnknownProperties) {
		oldUnknownPropertyPaths = this.unknownPropertyPaths;
		oldKnownPropertyPaths = this.knownPropertyPaths;
	}
	var errorAtEnd = true;
	for (var i = 0; i < schema.anyOf.length; i++) {
		if (this.trackUnknownProperties) {
			this.unknownPropertyPaths = {};
			this.knownPropertyPaths = {};
		}
		var subSchema = schema.anyOf[i];

		var errorCount = this.errors.length;
		var error = this.validateAll(data, subSchema, [], ["anyOf", i], dataPointerPath);

		if (error === null && errorCount === this.errors.length) {
			this.errors = this.errors.slice(0, startErrorCount);

			if (this.trackUnknownProperties) {
				for (var knownKey in this.knownPropertyPaths) {
					oldKnownPropertyPaths[knownKey] = true;
					delete oldUnknownPropertyPaths[knownKey];
				}
				for (var unknownKey in this.unknownPropertyPaths) {
					if (!oldKnownPropertyPaths[unknownKey]) {
						oldUnknownPropertyPaths[unknownKey] = true;
					}
				}
				// We need to continue looping so we catch all the property definitions, but we don't want to return an error
				errorAtEnd = false;
				continue;
			}

			return null;
		}
		if (error) {
			errors.push(error.prefixWith(null, "" + i).prefixWith(null, "anyOf"));
		}
	}
	if (this.trackUnknownProperties) {
		this.unknownPropertyPaths = oldUnknownPropertyPaths;
		this.knownPropertyPaths = oldKnownPropertyPaths;
	}
	if (errorAtEnd) {
		errors = errors.concat(this.errors.slice(startErrorCount));
		this.errors = this.errors.slice(0, startErrorCount);
		return this.createError(ErrorCodes.ANY_OF_MISSING, {}, "", "/anyOf", errors);
	}
};

ValidatorContext.prototype.validateOneOf = function validateOneOf(data, schema, dataPointerPath) {
	if (schema.oneOf === undefined) {
		return null;
	}
	var validIndex = null;
	var errors = [];
	var startErrorCount = this.errors.length;
	var oldUnknownPropertyPaths, oldKnownPropertyPaths;
	if (this.trackUnknownProperties) {
		oldUnknownPropertyPaths = this.unknownPropertyPaths;
		oldKnownPropertyPaths = this.knownPropertyPaths;
	}
	for (var i = 0; i < schema.oneOf.length; i++) {
		if (this.trackUnknownProperties) {
			this.unknownPropertyPaths = {};
			this.knownPropertyPaths = {};
		}
		var subSchema = schema.oneOf[i];

		var errorCount = this.errors.length;
		var error = this.validateAll(data, subSchema, [], ["oneOf", i], dataPointerPath);

		if (error === null && errorCount === this.errors.length) {
			if (validIndex === null) {
				validIndex = i;
			} else {
				this.errors = this.errors.slice(0, startErrorCount);
				return this.createError(ErrorCodes.ONE_OF_MULTIPLE, {index1: validIndex, index2: i}, "", "/oneOf");
			}
			if (this.trackUnknownProperties) {
				for (var knownKey in this.knownPropertyPaths) {
					oldKnownPropertyPaths[knownKey] = true;
					delete oldUnknownPropertyPaths[knownKey];
				}
				for (var unknownKey in this.unknownPropertyPaths) {
					if (!oldKnownPropertyPaths[unknownKey]) {
						oldUnknownPropertyPaths[unknownKey] = true;
					}
				}
			}
		} else if (error) {
			errors.push(error);
		}
	}
	if (this.trackUnknownProperties) {
		this.unknownPropertyPaths = oldUnknownPropertyPaths;
		this.knownPropertyPaths = oldKnownPropertyPaths;
	}
	if (validIndex === null) {
		errors = errors.concat(this.errors.slice(startErrorCount));
		this.errors = this.errors.slice(0, startErrorCount);
		return this.createError(ErrorCodes.ONE_OF_MISSING, {}, "", "/oneOf", errors);
	} else {
		this.errors = this.errors.slice(0, startErrorCount);
	}
	return null;
};

ValidatorContext.prototype.validateNot = function validateNot(data, schema, dataPointerPath) {
	if (schema.not === undefined) {
		return null;
	}
	var oldErrorCount = this.errors.length;
	var oldUnknownPropertyPaths, oldKnownPropertyPaths;
	if (this.trackUnknownProperties) {
		oldUnknownPropertyPaths = this.unknownPropertyPaths;
		oldKnownPropertyPaths = this.knownPropertyPaths;
		this.unknownPropertyPaths = {};
		this.knownPropertyPaths = {};
	}
	var error = this.validateAll(data, schema.not, null, null, dataPointerPath);
	var notErrors = this.errors.slice(oldErrorCount);
	this.errors = this.errors.slice(0, oldErrorCount);
	if (this.trackUnknownProperties) {
		this.unknownPropertyPaths = oldUnknownPropertyPaths;
		this.knownPropertyPaths = oldKnownPropertyPaths;
	}
	if (error === null && notErrors.length === 0) {
		return this.createError(ErrorCodes.NOT_PASSED, {}, "", "/not");
	}
	return null;
};

ValidatorContext.prototype.validateHypermedia = function validateCombinations(data, schema, dataPointerPath) {
	if (!schema.links) {
		return null;
	}
	var error;
	for (var i = 0; i < schema.links.length; i++) {
		var ldo = schema.links[i];
		if (ldo.rel === "describedby") {
			var template = new UriTemplate(ldo.href);
			var allPresent = true;
			for (var j = 0; j < template.varNames.length; j++) {
				if (!(template.varNames[j] in data)) {
					allPresent = false;
					break;
				}
			}
			if (allPresent) {
				var schemaUrl = template.fillFromObject(data);
				var subSchema = {"$ref": schemaUrl};
				if (error = this.validateAll(data, subSchema, [], ["links", i], dataPointerPath)) {
					return error;
				}
			}
		}
	}
};

// parseURI() and resolveUrl() are from https://gist.github.com/1088850
//   -  released as public domain by author ("Yaffle") - see comments on gist

function parseURI(url) {
	var m = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
	// authority = '//' + user + ':' + pass '@' + hostname + ':' port
	return (m ? {
		href     : m[0] || '',
		protocol : m[1] || '',
		authority: m[2] || '',
		host     : m[3] || '',
		hostname : m[4] || '',
		port     : m[5] || '',
		pathname : m[6] || '',
		search   : m[7] || '',
		hash     : m[8] || ''
	} : null);
}

function resolveUrl(base, href) {// RFC 3986

	function removeDotSegments(input) {
		var output = [];
		input.replace(/^(\.\.?(\/|$))+/, '')
			.replace(/\/(\.(\/|$))+/g, '/')
			.replace(/\/\.\.$/, '/../')
			.replace(/\/?[^\/]*/g, function (p) {
				if (p === '/..') {
					output.pop();
				} else {
					output.push(p);
				}
		});
		return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
	}

	href = parseURI(href || '');
	base = parseURI(base || '');

	return !href || !base ? null : (href.protocol || base.protocol) +
		(href.protocol || href.authority ? href.authority : base.authority) +
		removeDotSegments(href.protocol || href.authority || href.pathname.charAt(0) === '/' ? href.pathname : (href.pathname ? ((base.authority && !base.pathname ? '/' : '') + base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname) : base.pathname)) +
		(href.protocol || href.authority || href.pathname ? href.search : (href.search || base.search)) +
		href.hash;
}

function getDocumentUri(uri) {
	return uri.split('#')[0];
}
function normSchema(schema, baseUri) {
	if (schema && typeof schema === "object") {
		if (baseUri === undefined) {
			baseUri = schema.id;
		} else if (typeof schema.id === "string") {
			baseUri = resolveUrl(baseUri, schema.id);
			schema.id = baseUri;
		}
		if (Array.isArray(schema)) {
			for (var i = 0; i < schema.length; i++) {
				normSchema(schema[i], baseUri);
			}
		} else {
			if (typeof schema['$ref'] === "string") {
				schema['$ref'] = resolveUrl(baseUri, schema['$ref']);
			}
			for (var key in schema) {
				if (key !== "enum") {
					normSchema(schema[key], baseUri);
				}
			}
		}
	}
}

var ErrorCodes = {
	INVALID_TYPE: 0,
	ENUM_MISMATCH: 1,
	ANY_OF_MISSING: 10,
	ONE_OF_MISSING: 11,
	ONE_OF_MULTIPLE: 12,
	NOT_PASSED: 13,
	// Numeric errors
	NUMBER_MULTIPLE_OF: 100,
	NUMBER_MINIMUM: 101,
	NUMBER_MINIMUM_EXCLUSIVE: 102,
	NUMBER_MAXIMUM: 103,
	NUMBER_MAXIMUM_EXCLUSIVE: 104,
	NUMBER_NOT_A_NUMBER: 105,
	// String errors
	STRING_LENGTH_SHORT: 200,
	STRING_LENGTH_LONG: 201,
	STRING_PATTERN: 202,
	// Object errors
	OBJECT_PROPERTIES_MINIMUM: 300,
	OBJECT_PROPERTIES_MAXIMUM: 301,
	OBJECT_REQUIRED: 302,
	OBJECT_ADDITIONAL_PROPERTIES: 303,
	OBJECT_DEPENDENCY_KEY: 304,
	// Array errors
	ARRAY_LENGTH_SHORT: 400,
	ARRAY_LENGTH_LONG: 401,
	ARRAY_UNIQUE: 402,
	ARRAY_ADDITIONAL_ITEMS: 403,
	// Custom/user-defined errors
	FORMAT_CUSTOM: 500,
	KEYWORD_CUSTOM: 501,
	// Schema structure
	CIRCULAR_REFERENCE: 600,
	// Non-standard validation options
	UNKNOWN_PROPERTY: 1000
};
var ErrorCodeLookup = {};
for (var key in ErrorCodes) {
	ErrorCodeLookup[ErrorCodes[key]] = key;
}
var ErrorMessagesDefault = {
	INVALID_TYPE: "Invalid type: {type} (expected {expected})",
	ENUM_MISMATCH: "No enum match for: {value}",
	ANY_OF_MISSING: "Data does not match any schemas from \"anyOf\"",
	ONE_OF_MISSING: "Data does not match any schemas from \"oneOf\"",
	ONE_OF_MULTIPLE: "Data is valid against more than one schema from \"oneOf\": indices {index1} and {index2}",
	NOT_PASSED: "Data matches schema from \"not\"",
	// Numeric errors
	NUMBER_MULTIPLE_OF: "Value {value} is not a multiple of {multipleOf}",
	NUMBER_MINIMUM: "Value {value} is less than minimum {minimum}",
	NUMBER_MINIMUM_EXCLUSIVE: "Value {value} is equal to exclusive minimum {minimum}",
	NUMBER_MAXIMUM: "Value {value} is greater than maximum {maximum}",
	NUMBER_MAXIMUM_EXCLUSIVE: "Value {value} is equal to exclusive maximum {maximum}",
	NUMBER_NOT_A_NUMBER: "Value {value} is not a valid number",
	// String errors
	STRING_LENGTH_SHORT: "String is too short ({length} chars), minimum {minimum}",
	STRING_LENGTH_LONG: "String is too long ({length} chars), maximum {maximum}",
	STRING_PATTERN: "String does not match pattern: {pattern}",
	// Object errors
	OBJECT_PROPERTIES_MINIMUM: "Too few properties defined ({propertyCount}), minimum {minimum}",
	OBJECT_PROPERTIES_MAXIMUM: "Too many properties defined ({propertyCount}), maximum {maximum}",
	OBJECT_REQUIRED: "Missing required property: {key}",
	OBJECT_ADDITIONAL_PROPERTIES: "Additional properties not allowed",
	OBJECT_DEPENDENCY_KEY: "Dependency failed - key must exist: {missing} (due to key: {key})",
	// Array errors
	ARRAY_LENGTH_SHORT: "Array is too short ({length}), minimum {minimum}",
	ARRAY_LENGTH_LONG: "Array is too long ({length}), maximum {maximum}",
	ARRAY_UNIQUE: "Array items are not unique (indices {match1} and {match2})",
	ARRAY_ADDITIONAL_ITEMS: "Additional items not allowed",
	// Format errors
	FORMAT_CUSTOM: "Format validation failed ({message})",
	KEYWORD_CUSTOM: "Keyword failed: {key} ({message})",
	// Schema structure
	CIRCULAR_REFERENCE: "Circular $refs: {urls}",
	// Non-standard validation options
	UNKNOWN_PROPERTY: "Unknown property (not in schema)"
};

function ValidationError(code, message, params, dataPath, schemaPath, subErrors) {
	Error.call(this);
	if (code === undefined) {
		throw new Error ("No code supplied for error: "+ message);
	}
	this.message = message;
	this.params = params;
	this.code = code;
	this.dataPath = dataPath || "";
	this.schemaPath = schemaPath || "";
	this.subErrors = subErrors || null;

	var err = new Error(this.message);
	this.stack = err.stack || err.stacktrace;
	if (!this.stack) {
		try {
			throw err;
		}
		catch(err) {
			this.stack = err.stack || err.stacktrace;
		}
	}
}
ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;
ValidationError.prototype.name = 'ValidationError';

ValidationError.prototype.prefixWith = function (dataPrefix, schemaPrefix) {
	if (dataPrefix !== null) {
		dataPrefix = dataPrefix.replace(/~/g, "~0").replace(/\//g, "~1");
		this.dataPath = "/" + dataPrefix + this.dataPath;
	}
	if (schemaPrefix !== null) {
		schemaPrefix = schemaPrefix.replace(/~/g, "~0").replace(/\//g, "~1");
		this.schemaPath = "/" + schemaPrefix + this.schemaPath;
	}
	if (this.subErrors !== null) {
		for (var i = 0; i < this.subErrors.length; i++) {
			this.subErrors[i].prefixWith(dataPrefix, schemaPrefix);
		}
	}
	return this;
};

function isTrustedUrl(baseUrl, testUrl) {
	if(testUrl.substring(0, baseUrl.length) === baseUrl){
		var remainder = testUrl.substring(baseUrl.length);
		if ((testUrl.length > 0 && testUrl.charAt(baseUrl.length - 1) === "/")
			|| remainder.charAt(0) === "#"
			|| remainder.charAt(0) === "?") {
			return true;
		}
	}
	return false;
}

var languages = {};
function createApi(language) {
	var globalContext = new ValidatorContext();
	var currentLanguage = language || 'en';
	var api = {
		addFormat: function () {
			globalContext.addFormat.apply(globalContext, arguments);
		},
		language: function (code) {
			if (!code) {
				return currentLanguage;
			}
			if (!languages[code]) {
				code = code.split('-')[0]; // fall back to base language
			}
			if (languages[code]) {
				currentLanguage = code;
				return code; // so you can tell if fall-back has happened
			}
			return false;
		},
		addLanguage: function (code, messageMap) {
			var key;
			for (key in ErrorCodes) {
				if (messageMap[key] && !messageMap[ErrorCodes[key]]) {
					messageMap[ErrorCodes[key]] = messageMap[key];
				}
			}
			var rootCode = code.split('-')[0];
			if (!languages[rootCode]) { // use for base language if not yet defined
				languages[code] = messageMap;
				languages[rootCode] = messageMap;
			} else {
				languages[code] = Object.create(languages[rootCode]);
				for (key in messageMap) {
					if (typeof languages[rootCode][key] === 'undefined') {
						languages[rootCode][key] = messageMap[key];
					}
					languages[code][key] = messageMap[key];
				}
			}
			return this;
		},
		freshApi: function (language) {
			var result = createApi();
			if (language) {
				result.language(language);
			}
			return result;
		},
		validate: function (data, schema, checkRecursive, banUnknownProperties) {
			var context = new ValidatorContext(globalContext, false, languages[currentLanguage], checkRecursive, banUnknownProperties);
			if (typeof schema === "string") {
				schema = {"$ref": schema};
			}
			context.addSchema("", schema);
			var error = context.validateAll(data, schema, null, null, "");
			if (!error && banUnknownProperties) {
				error = context.banUnknownProperties();
			}
			this.error = error;
			this.missing = context.missing;
			this.valid = (error === null);
			return this.valid;
		},
		validateResult: function () {
			var result = {};
			this.validate.apply(result, arguments);
			return result;
		},
		validateMultiple: function (data, schema, checkRecursive, banUnknownProperties) {
			var context = new ValidatorContext(globalContext, true, languages[currentLanguage], checkRecursive, banUnknownProperties);
			if (typeof schema === "string") {
				schema = {"$ref": schema};
			}
			context.addSchema("", schema);
			context.validateAll(data, schema, null, null, "");
			if (banUnknownProperties) {
				context.banUnknownProperties();
			}
			var result = {};
			result.errors = context.errors;
			result.missing = context.missing;
			result.valid = (result.errors.length === 0);
			return result;
		},
		addSchema: function () {
			return globalContext.addSchema.apply(globalContext, arguments);
		},
		getSchema: function () {
			return globalContext.getSchema.apply(globalContext, arguments);
		},
		getSchemaMap: function () {
			return globalContext.getSchemaMap.apply(globalContext, arguments);
		},
		getSchemaUris: function () {
			return globalContext.getSchemaUris.apply(globalContext, arguments);
		},
		getMissingUris: function () {
			return globalContext.getMissingUris.apply(globalContext, arguments);
		},
		dropSchemas: function () {
			globalContext.dropSchemas.apply(globalContext, arguments);
		},
		defineKeyword: function () {
			globalContext.defineKeyword.apply(globalContext, arguments);
		},
		defineError: function (codeName, codeNumber, defaultMessage) {
			if (typeof codeName !== 'string' || !/^[A-Z]+(_[A-Z]+)*$/.test(codeName)) {
				throw new Error('Code name must be a string in UPPER_CASE_WITH_UNDERSCORES');
			}
			if (typeof codeNumber !== 'number' || codeNumber%1 !== 0 || codeNumber < 10000) {
				throw new Error('Code number must be an integer > 10000');
			}
			if (typeof ErrorCodes[codeName] !== 'undefined') {
				throw new Error('Error already defined: ' + codeName + ' as ' + ErrorCodes[codeName]);
			}
			if (typeof ErrorCodeLookup[codeNumber] !== 'undefined') {
				throw new Error('Error code already used: ' + ErrorCodeLookup[codeNumber] + ' as ' + codeNumber);
			}
			ErrorCodes[codeName] = codeNumber;
			ErrorCodeLookup[codeNumber] = codeName;
			ErrorMessagesDefault[codeName] = ErrorMessagesDefault[codeNumber] = defaultMessage;
			for (var langCode in languages) {
				var language = languages[langCode];
				if (language[codeName]) {
					language[codeNumber] = language[codeNumber] || language[codeName];
				}
			}
		},
		reset: function () {
			globalContext.reset();
			this.error = null;
			this.missing = [];
			this.valid = true;
		},
		missing: [],
		error: null,
		valid: true,
		normSchema: normSchema,
		resolveUrl: resolveUrl,
		getDocumentUri: getDocumentUri,
		errorCodes: ErrorCodes
	};
	return api;
}

var tv4 = createApi();
tv4.addLanguage('en-gb', ErrorMessagesDefault);

//legacy property
tv4.tv4 = tv4;

return tv4; // used by _header.js to globalise.

}));
},{}]},{},[6]);