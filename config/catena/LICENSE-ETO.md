# Licenza dei dati di ETO

Il file `eto.yaml` in questa cartella contiene dati del dataset *Advanced Semiconductor Supply Chain Dataset* dell'Emerging Technology Observatory (ETO), Center for Security and Emerging Technology (CSET), Georgetown University: https://eto.tech/dataset-docs/chipexplorer

Quel file **non** è coperto dalla licenza MIT del repository. Vale la licenza di ETO, riportata qui sotto così com'è nel loro repository (https://github.com/georgetown-cset/eto-supply-chain/blob/main/LICENSE.md):

> This work is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.

**Modifiche di AI Radar:** dal dataset sono state ricopiate a mano solo le quote per Paese di tre voci (progettazione e fabbricazione del 2022, macchinari di litografia del 2025), senza le righe «Various countries» e con i Paesi indicati dal codice `ADM0_A3`.

**Uso commerciale non consentito.** Chi riusa questo repository per scopi commerciali deve togliere `eto.yaml`, e il file `catena.json` che se ne ricava, oppure chiedere il permesso a ETO. Le ragioni della scelta stanno in `docs/adr/0001-dati-eto-in-cc-by-nc.md`.
