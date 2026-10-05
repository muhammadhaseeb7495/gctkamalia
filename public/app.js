/* Login, register and dashboard pages */
(function () {
  var d = document;
  function api(url, method, body) {
    return fetch(url, { method: method || 'GET', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'Request failed'); return j; }); });
  }
  function el(tag, text, cls) { var e = d.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }
  var msg = d.getElementById('auth-msg');
  function wire(id, url) {
    var f = d.getElementById(id); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var o = {};
      new FormData(f).forEach(function (v, k) { o[k] = v; });
      api(url, 'POST', o).then(function () { location.href = 'dashboard.html'; }).catch(function (err) { msg.textContent = err.message; });
    });
  }
  wire('login-form', '/api/login'); wire('register-form', '/api/register');

  var dash = d.getElementById('dash');
  if (!dash) return;
  api('/api/dashboard').then(render).catch(function () { location.href = 'login.html'; });

  function render(x) {
    dash.textContent = '';
    dash.appendChild(el('h2', 'Welcome, ' + x.user.name));
    dash.appendChild(el('p', x.user.email + (x.user.role === 'admin' ? ' (administrator)' : '')));
    var out = el('button', 'Log out', 'btn'); out.type = 'button';
    out.onclick = function () { api('/api/logout', 'POST').then(function () { location.href = 'index.html'; }); };
    dash.appendChild(out);
    function section(title, items, fill) {
      dash.appendChild(el('h2', title));
      var ul = el('ul', undefined, 'rv');
      if (!items.length) ul.appendChild(el('li', 'Nothing here yet.'));
      items.forEach(function (i) { var li = el('li'); fill(li, i); ul.appendChild(li); });
      dash.appendChild(ul);
    }
    function inquiry(li, i) {
      li.appendChild(el('b', i.name + ' - ' + i.phone));
      li.appendChild(el('p', [i.program, i.last_class, i.note, i.created_at].filter(Boolean).join(' | ')));
    }
    if (x.user.role === 'admin') {
      section('Admission inquiries', x.inquiries, inquiry);
      section('Reviews waiting for approval', x.pendingReviews, function (li, r) {
        li.appendChild(el('b', r.name)); li.appendChild(el('span', ' ' + '★'.repeat(r.stars), 'stars')); li.appendChild(el('p', r.text));
        ['Approve', 'Delete'].forEach(function (a) {
          var b = el('button', a, 'btn'); b.type = 'button';
          b.onclick = function () {
            api('/api/admin/reviews/' + r.id + (a === 'Approve' ? '/approve' : ''), a === 'Approve' ? 'POST' : 'DELETE').then(function () { location.reload(); });
          };
          li.appendChild(b);
        });
      });
    } else {
      section('My reviews', x.myReviews, function (li, r) {
        li.appendChild(el('span', '★'.repeat(r.stars), 'stars'));
        li.appendChild(el('p', r.text + (r.approved ? '' : ' (waiting for approval)')));
      });
      section('My inquiries', x.myInquiries, inquiry);
    }
  }
})();
