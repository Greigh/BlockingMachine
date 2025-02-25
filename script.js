
window.PAGE_TYPE = 'protected_rule';

window.locales = {

    en: {
        metaTitle: 'BlockingMachine',
        backBtn: 'Go back',
        safeDropdownTitle3: 'Why is this website blocked?',
        protectedDropDownTitle3: 'Why is this website blocked?',
        safeDropdownDesc3: 'This website is blocked because it’s marked as an advertising or tracking domain. Your administrator has blocked access to <strong>%host%</strong>',
        protectedDropdownDesc3: 'This website is blocked because it’s marked as an advertising or tracking domain. Your administrator has blocked access to <strong>%host%</strong>',

        safeDropdownTitle4: 'How to unblock this website?',
        safeDropdownDesc4_1: 'To unblock this website, sign up at <a href=\'%dns_website_url%\'>%dns_domain%</a> and connect this device to your server. Go to <strong>Server settings</strong> → <strong>User rules</strong> and create an unblocking rule for this website',
        protectedDropdownDesc4: 'If you believe this website has been blocked in error, please <a href=\'%reports_new_issue_url%\'>let us know</a>',

        protectedTitle: 'Access blocked: <span>Ad or tracking domain</span>',
        protectedDesc: 'Your administrator blocked access to <strong>%host%</strong> because it’s marked as an advertising or tracking domain. This website may track your activity or display ads.',
    },
};

!function () {
    'use strict';
    var t, o = window;
    o.NodeList && !NodeList.prototype.forEach && (NodeList.prototype.forEach = function (t, n) {
        n = n || o;
        for (var e = 0; e < this.length; e++)
            t.call(n, this[e], e, this);
    }
    );
    var n = null
        , e = 'BlockingMachine'
        , a = null !== (t = o.location.host) && void 0 !== t ? t : ''
        , r = {
            host: a,
            reports_url: ''.concat(a, '&from=').concat(o.PAGE_TYPE, '&app=').concat(e),
            reports_new_issue_url: ''.concat(o.PAGE_TYPE, '&app=').concat(e),
            website_url: ''.concat(o.PAGE_TYPE, '&app=').concat(e),
            dns_website_url: ''.concat(o.PAGE_TYPE, '&app=').concat(e),
            dns_domain: '',
            user_rules_url: ''.concat(o.PAGE_TYPE, '&app=').concat(e),
            users_count: '100',
        };
    document.querySelectorAll('[data-id]').forEach((function (t) {
        var e = t.dataset.id;
        if (e) {
            var a = function (t) {
                var e, a;
                if (!n) {
                    var r = (navigator.language || navigator.browserLanguage).replace(/-/g, '_').toLowerCase()
                        , c = r.substr(0, 2).toLowerCase();
                    n = o.locales[r] || o.locales[c] || o.locales.en;
                }
                return null !== (e = null !== (a = n[t]) && void 0 !== a ? a : o.locales.en[t]) && void 0 !== e ? e : t;
            }(e);
            for (var c in r)
                a = a.replace(new RegExp('%'.concat(c, '%'), 'g'), r[c]);
            t.innerHTML = a;
        }
    }
    ));
    var c = !!window.MSInputMethodContext && !!document.documentMode
        , d = 'active'
        , i = document.querySelectorAll('[data-dropdown-item]');
    i.forEach((function (t) {
        var o = t.querySelector('[data-dropdown-toggle]')
            , n = t.querySelector('[data-dropdown-content]');
        null == o || o.addEventListener('click', (function (e) {
            i.forEach((function (t) {
                var n = t.querySelector('[data-dropdown-toggle]')
                    , e = t.querySelector('[data-dropdown-content]');
                n !== o && (n.classList.remove(d),
                e.classList.remove(d));
            }
            )),
            e.currentTarget.classList.toggle(d),
            n.classList.toggle(d),
            c ? document.documentElement.scrollTop = t.offsetTop : n.addEventListener('transitionend', (function () {
                window.scrollTo({
                    top: window.scrollY + t.getBoundingClientRect().top,
                    behavior: 'smooth'
                });
            }
            ), {
                once: !0
            });
        }
        ));
    }
    )),
    document.querySelectorAll('[data-back-btn]').forEach((function (t) {
        t.addEventListener('click', (function () {
            o.history.back();
        }
        ));
    }
    ));
}();
