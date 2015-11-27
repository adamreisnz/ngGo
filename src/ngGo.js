/**
 * ngGo
 *
 * This is the AngularJS implementation of WGo, based on WGo version 2.3.1. All code has been
 * refactored to fit the Angular framework, as well as having been linted, properly commented
 * and generally cleaned up.
 *
 * Copyright (c) 2013 Jan Prokop (WGo)
 * Copyright (c) 2014-2015 Adam Buczynski (ngGo)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
 * to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo', [])

/**
 * ngGo constants
 */
.constant('ngGo', {
  name:   'ngGo',
  version:  '1.1.1',
  error:    {

    //Position errors
    POSITION_OUT_OF_BOUNDS:   1,
    POSITION_ALREADY_HAS_STONE: 2,
    POSITION_IS_SUICIDE:    3,
    POSITION_IS_REPEATING:    4,

    //Data loading errors
    NO_DATA:          5,
    UNKNOWN_DATA:       6,
    INVALID_SGF:        7,
    INVALID_GIB:        8,
    INVALID_JGF_JSON:     9,
    INVALID_JGF_TREE_JSON:    10
  }
})

/**
 * Stone colors
 */
.constant('StoneColor', {
  E: 0,
  EMPTY: 0,
  B:  1,
  BLACK: 1,
  W:  -1,
  WHITE: -1
})

/**
 * Markup types
 */
.constant('MarkupTypes', {
  TRIANGLE: 'triangle',
  CIRCLE:   'circle',
  SQUARE:   'square',
  MARK:   'mark',
  SELECT:   'select',
  LABEL:    'label',
  LAST:   'last',
  SAD:    'sad',
  HAPPY:    'happy'
})

/**
 * Player modes
 */
.constant('PlayerModes', {
  PLAY: 'play',
  REPLAY: 'replay',
  EDIT: 'edit',
  SOLVE:  'solve'
})

/**
 * Player tools
 */
.constant('PlayerTools', {
  NONE: 'none',
  MOVE: 'move',
  SCORE:  'score',
  SETUP:  'setup',
  MARKUP: 'markup'
})

/**
 * Key codes
 */
.constant('KeyCodes', {
  LEFT:   37,
  RIGHT:    39,
  UP:     38,
  DOWN:   40,
  ESC:    27,
  ENTER:    13,
  SPACE:    32,
  TAB:    9,
  SHIFT:    16,
  CTRL:   17,
  ALT:    18,
  HOME:   36,
  END:    35,
  PAGEUP:   33,
  PAGEDOWN: 34
});
