import math
import copy
from flask import Flask, request, Response
import psycopg2 as pg
import psycopg2.extras as pg_extras
from psycopg2.extensions import adapt, register_adapter, AsIs
import re
import json

from .creds import creds

from pyparsing import nestedExpr
import traceback

app = Flask(__name__)
MAX_ITERS = 128

SI_0 = { a: 0 for a in 'm,A,cd,s,mol,K,kg'.split(',') }

def agg_unit_tree(T, cur):
  SPLIT_CHARS = '/*\u00b7\u00f7'.split()
  unit_factor = 1.0
  unit = copy.copy(SI_0)
  exp = 1
  
  long_units = []
  
  if isinstance(T, str):
    unit_split = [a.strip() for a in re.split(r'([%s]+)' % ''.join(SPLIT_CHARS), T)] # [\w\d&!@#$%?;:\'"\[\]{}-_=+]
    for i, tok in enumerate(unit_split): # enumerate(zip(unit_split[::2], unit_split[1::2])):
      if i % 2 == 1:
        if tok in ['/', '÷']:
          exp = -1
      else:
        if tok != '':
          cur.execute('SELECT * FROM units WHERE pool = \'WIKI\' AND name = %s LIMIT 1', (tok,))
          d = cur.fetchone()
            
          if d != None:
            unit_factor *= d['factor'] ** exp
            long_units.append((d['long_name'], exp))
            for si in unit.keys():
              unit[si] += d['si_%s' % si.lower()] * exp
          else:
            raise Exception('Unit %s was not recognized.' % tok)
        elif i > 0 and i < len(unit_split) - 1:
          raise Exception('Unit parsing error: missing unit between operands/braces')
  else:
    for t in T:
      A = agg_unit_tree(t, cur)
      next_unit_factor, next_unit, next_long_units, next_exp = A
      print(A)
      unit_factor *= next_unit_factor ** exp
      long_units += [(u[0], u[1] * exp) for u in next_long_units]
      for u, uv in next_unit.items():
        unit[u] += uv * exp
      exp = next_exp
      
  return unit_factor, unit, long_units, exp

def pp_unit(U):
  U = dict(U)
  return ' '.join([ ('%s^%d' % u if u[1] != 1 else u[0]) for u in U.items() if u[1] != 0])

@app.route('/end/q', methods=['POST'])
def solve():
  with pg.connect('dbname=x2585 ' + creds) as conn:
    cur = conn.cursor(cursor_factory=pg_extras.RealDictCursor)
    
    # unit = copy.copy(SI_0)
    # unit_factor = 1.0
    unit_name = '' # TODO
    unit_sym = '' # TODO
    
    try:
      unit_tree = nestedExpr('(', ')').parseString('(%s)' % request.form['term_unit']).asList()
      unit_factor, unit, long_units, _ = agg_unit_tree(unit_tree, cur)
      print(unit_factor, unit)
    except Exception as e:
      traceback.print_exc()
      return { 'err': str(e) }, 400
      
      # unit_split = re.split(r'\W', request.form['term_unit']) # TODO: need more sophisticated parsing for math
      # for a in unit_split:
      #   if len(a) > 0:
      #     cur.execute('SELECT * FROM units WHERE name LIKE %s LIMIT 1', (a,))
      #     d = cur.fetchone()
      #     if d != None:
      #       unit_factor *= d['factor']
      #       for si in unit.keys():
      #         unit[si] += d['si_%s' % si.lower()]
      #     else:
      #       return { 'err': 'Unit %s was not recognized.' % a }, 400
    
    try:
      fro = float(request.form['term_start']) * unit_factor
      to = float(request.form['term_end']) * unit_factor
    except ValueError:
      return { 'err': 'Start and/or end values "%s" and "%s" are invalid: must be numeric.' % (request.form['term_start'], request.form['term_end']) }, 400
    
    if (to == 0 or fro == 0) and to != fro:
      return { 'err': 'Impossible to solve when exactly one input is 0.' }, 400
      
    # if math.log(to / fro) > MAX_ITERS / math.log(2):
    #   return { 'err': 'Inputs are too far apart (>2^%d): cannot possibly solve in %d iterations' % (MAX_ITERS, MAX_ITERS) }, 400
    
    diff = float('inf')
    path = []
    iters = 0
    while abs(to - fro) / unit_factor > 0.5:
      q = '''SELECT * FROM (SELECT *, ABS(LOG(st0.vto / %%s)) AS diff FROM (SELECT long_name AS vto_unit_long, name AS vto_unit, factor, ROUND(%%s / factor) * factor AS vto FROM units WHERE pool = %%s AND factor > 0 AND %s) st0 WHERE st0.vto > 0) st1 ORDER BY st1.diff ASC LIMIT 1;''' % ' AND '.join(['si_%s=%%s' % k.lower() for k in unit.keys()])
      cur.execute(q, (to, fro, request.form['unit_pool'],) + tuple(unit.values())) # possibly sanitize pool among allowable enums
      row = cur.fetchone()
      
      if row == None:
        return { 'err': 'No units available that match %s = %s' % (pp_unit(unit), pp_unit(long_units)) }, 400
        
      row['fro'] = fro
      path.append(row)
      print(row)
      
      fro = round(fro / row['factor']) * row['factor'] # row['vto'] / row['factor']
      
      if iters > MAX_ITERS:
        return { 'err': 'Too hard to fudge, failed to solve in %d iterations.' % MAX_ITERS }, 400
      iters += 1
      
    return { 'start': request.form['term_start'], 'end': fro / unit_factor, 'unit': request.form['term_unit'], 'unit_factor': unit_factor, 'path': path } # TODO use something better than the raw request, and don't do the conversion to final here