// Web Worker for the bridge double-dummy solver (Emscripten WASM)
// Communicates with DoubleDummy.vue via postMessage

let isReady = false;

// Convert a hand array [{suit, value}, ...] to the solver's string format
// e.g. [{suit:'spades',value:'A'},{suit:'hearts',value:'K'},...] → "A K - -"
function handToSolverString(cards) {
  const suitOrder = ['spades', 'hearts', 'diamonds', 'clubs'];
  return suitOrder.map(function(suit) {
    var suitCards = cards.filter(function(c) { return c.suit === suit; });
    if (!suitCards.length) return '-';
    return suitCards.map(function(c) {
      return c.value === '10' ? 'T' : c.value;
    }).join('');
  }).join(' ');
}

// Parse the raw output of solve() into a structured object
// Output format (5 lines):
//   N  4  4  7  7
//   S  8  8  5  5
//   H  8  8  5  5
//   D  3  3 10 10
//   C  5  5  8  8
// Column order: N declares, S declares, E declares, W declares
// Values: tricks for the DECLARING side
function parseSolveResult(output) {
  var result = {};
  var strainMap = { 'N': 'NT', 'S': 'S', 'H': 'H', 'D': 'D', 'C': 'C' };
  var lines = output.trim().split('\n');
  for (var i = 0; i < lines.length; i++) {
    var parts = lines[i].trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 5) {
      var strainKey = strainMap[parts[0]];
      if (strainKey) {
        result[strainKey] = {
          N: parseInt(parts[1], 10),
          S: parseInt(parts[2], 10),
          E: parseInt(parts[3], 10),
          W: parseInt(parts[4], 10)
        };
      }
    }
  }
  return result;
}

self.onmessage = function(e) {
  var type = e.data.type;
  var id = e.data.id;
  var payload = e.data.payload;
  console.log('[solver.worker] Message reçu:', type, id || '');

  if (type === 'init') {
    var baseUrl = payload.baseUrl;
    console.log('[solver.worker] Init, baseUrl =', baseUrl);

    // Pre-define Module BEFORE importScripts so solver.js picks it up
    // (importScripts runs in global scope, var Module checks for existing global)
    self.Module = {
      locateFile: function(path) {
        return baseUrl + path;
      },
      onRuntimeInitialized: function() {
        console.log('[solver.worker] WASM onRuntimeInitialized - solver prêt ✓');
        isReady = true;
        self.postMessage({ type: 'ready' });
      },
      // Suppress stdout/stderr output from the solver
      print: function() {},
      printErr: function() {}
    };

    try {
      console.log('[solver.worker] importScripts:', baseUrl + 'solver.js');
      importScripts(baseUrl + 'solver.js');
      console.log('[solver.worker] importScripts OK, attente onRuntimeInitialized...');
    } catch (err) {
      console.error('[solver.worker] Erreur importScripts:', err);
      self.postMessage({ type: 'error', id: 'init', error: 'Failed to load solver: ' + err.message });
    }
    return;
  }

  if (type === 'solve') {
    console.log('[solver.worker] solve() appelé, isReady =', isReady);
    if (!isReady) {
      self.postMessage({ type: 'error', id: id, error: 'Solver not ready yet' });
      return;
    }
    try {
      var deal = payload;
      var westStr  = handToSolverString(deal.west);
      var northStr = handToSolverString(deal.north);
      var eastStr  = handToSolverString(deal.east);
      var southStr = handToSolverString(deal.south);

      var raw = self.Module.solve(westStr, northStr, eastStr, southStr);
      console.log('[solver.worker] solve() raw output:', raw);
      var parsed = parseSolveResult(raw);
      console.log('[solver.worker] parsed:', parsed);

      self.postMessage({ type: 'result', id: id, data: parsed });
    } catch (err) {
      self.postMessage({ type: 'error', id: id, error: err.message });
    }
  }

  if (type === 'solve_plays') {
    console.log('[solver.worker] solve_plays appelé, isReady =', isReady);
    if (!isReady) {
      self.postMessage({ type: 'error', id: id, error: 'Solver not ready yet' });
      return;
    }
    try {
      var deal        = payload.deal;
      var level       = payload.level;       // 1-7
      var trump       = payload.trump;       // 'NT'|'S'|'H'|'D'|'C'
      var declarer    = payload.declarer;    // 'N'|'S'|'E'|'W'
      var playedCards = payload.playedCards || [];

      // Leader = player to the left of declarer (clockwise: N→E→S→W→N)
      // Declarer N(1)→leader W(0), S(3)→E(2), E(2)→N(1), W(0)→S(3)
      var declarerToLeader = { N: 0, S: 2, E: 1, W: 3 };
      var leadSeat = declarerToLeader[declarer];

      var trumpMap = { NT: 4, S: 0, H: 1, D: 2, C: 3 };
      var trumpInt = trumpMap[trump];

      var suitToChar = { spades: 'S', hearts: 'H', diamonds: 'D', clubs: 'C' };
      var playedStr = playedCards.map(function(c) {
        return suitToChar[c.suit] + (c.value === '10' ? 'T' : c.value);
      }).join('');

      var westStr  = handToSolverString(deal.west);
      var northStr = handToSolverString(deal.north);
      var eastStr  = handToSolverString(deal.east);
      var southStr = handToSolverString(deal.south);

      console.log('[solver.worker] solve_plays:', level, trump, 'déclarant', declarer,
                  '→ leadSeat', leadSeat, 'trumpInt', trumpInt,
                  'played:', playedStr || '(aucune)');

      var raw = self.Module.solve_plays(westStr, northStr, eastStr, southStr,
                                        level, trumpInt, leadSeat, playedStr);
      console.log('[solver.worker] solve_plays raw:', raw);

      // Parse "SA:+2 SK:+1 H7:-1 " → array of {suit, rank, delta}
      var suitCharToName = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' };
      var leads = raw.trim().split(/\s+/).filter(Boolean).map(function(token) {
        var parts    = token.split(':');
        var cardCode = parts[0];
        var delta    = parseInt(parts[1], 10);
        return {
          suit:  suitCharToName[cardCode[0]],
          rank:  cardCode.slice(1) === 'T' ? '10' : cardCode.slice(1),
          delta: delta
        };
      });

      // Sort best lead first (highest delta = best for defenders/declarers depending on who leads)
      leads.sort(function(a, b) { return b.delta - a.delta; });

      self.postMessage({ type: 'result', id: id, data: leads });
    } catch (err) {
      console.error('[solver.worker] solve_plays error:', err);
      self.postMessage({ type: 'error', id: id, error: err.message });
    }
  }
};
