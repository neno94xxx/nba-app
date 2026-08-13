# Sljedeća sesija

## Završeno: migracija player game stats endpointa

- `boxscoretraditionalv3` je primarni izvor, uz V2 fallback.
- V3 home/away igrači mapiraju se u postojeći Supabase format.
- DNP redci zadržavaju postojeću V2 semantiku s `null` statistikama.
- Backend ne umeće već spremljene igrače i nakon upisa provjerava sve retke.
- UI prikazuje `Imported` samo nakon uspješne provjere spremanja.
- Dodani su automatski testovi za V3, V2 i fallback.

Integracijski test 31. srpnja 2026.:

- pojedinačni import: 27/27 redaka, ponavljanje 0 novih redaka;
- batch 20 utakmica: 511 redaka, svih 20 potvrđeno;
- ponovljeni batch: 0 novih redaka i 0 duplikata.
