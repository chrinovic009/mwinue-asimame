'use strict';
/* DNS de secours (uniquement en local, jamais utilisé sur Vercel) :
   si le DNS de Windows ne trouve pas une adresse alors que le navigateur y arrive,
   on la demande aux DNS publics 1.1.1.1 et 8.8.8.8. */
const dns = require('dns');
// Préférer IPv4 : beaucoup de connexions locales n'acheminent pas l'IPv6 (sinon : « Connect Timeout »)
try { dns.setDefaultResultOrder('ipv4first'); } catch (e) { /* */ }
const origLookup = dns.lookup;
const publicDns = new dns.Resolver();
publicDns.setServers(['1.1.1.1', '8.8.8.8']);
let dnsWarned = false;

dns.lookup = function (host, options, cb) {
  if (typeof options === 'function') { cb = options; options = {}; }
  if (typeof options === 'number') options = { family: options };
  options = options || {};
  origLookup.call(dns, host, options, (err, address, family) => {
    if (!err || !['ENOTFOUND', 'EAI_AGAIN', 'ESERVFAIL', 'ETIMEOUT'].includes(err.code)) return cb(err, address, family);
    publicDns.resolve4(host, (e2, addrs) => {
      if (e2 || !addrs || !addrs.length) return cb(err, address, family);
      if (!dnsWarned) { dnsWarned = true; console.log('  ℹ DNS de Windows en échec pour ' + host + ' : utilisation du DNS public de secours (1.1.1.1).'); }
      if (options.all) return cb(null, addrs.map(a => ({ address: a, family: 4 })));
      cb(null, addrs[0], 4);
    });
  });
};
