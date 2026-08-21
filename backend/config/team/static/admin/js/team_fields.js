(function() {
    function updateFields() {
        const gruppe = document.getElementById('id_gruppe').value;

        // Alle optionalen Felder
        const zusatzfeld = document.querySelector('.field-zusatzfeld');
        const email = document.querySelector('.field-email');
        const bild = document.querySelector('.field-bild');

        // Erstmal alles ausblenden
        [zusatzfeld, email, bild].forEach(el => {
            if (el) el.style.display = 'none';
        });

        // Je nach Gruppe einblenden
        if (gruppe === 'leitung' || gruppe === 'alt_leitung' || gruppe === 'neu_leitung') {
            if (zusatzfeld) zusatzfeld.style.display = '';
            if (email) email.style.display = '';
            if (bild) bild.style.display = '';
        } else if (gruppe === 'schluessel') {
            if (bild) bild.style.display = '';
        }
        // Mitglied: nichts extra
    }

    document.addEventListener('DOMContentLoaded', function() {
        const gruppeSelect = document.getElementById('id_gruppe');
        if (!gruppeSelect) return;

        // Beim Laden direkt ausführen
        updateFields();

        // Bei Änderung des Dropdowns
        gruppeSelect.addEventListener('change', updateFields);
    });
})();