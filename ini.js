/**
 * ini parsing library
 * (C) Rin 2019-2020
 */

module.exports = {
    regexSection: /\[(?:\s*)(\w+)(?:\s*)\]/,
    regexKey: /(?:\s*)([\w\[\]]+)(?:\s*)=(?:\s*)(.+)/,
    parse(inp) {
        let split = inp.split('\n');
        let current;
        let output = {};
        for (let i of split) {
            if (i.startsWith(';')) continue;
            let sr = this.regexSection.exec(i);
            if (sr) {
                current = sr[1];
                if (!output[current]) output[current] = {};
                continue;
            }
            let kr = this.regexKey.exec(i);
            if (kr) {
                let key = kr[1];
                let value = kr[2];
                if (value === "true") {
                    value = true;
                } else if (value === "false") {
                    value = false;
                } else if (!isNaN(parseInt(value)) && !key.startsWith('str_')) {
                    value = parseInt(value);
                } else if (value === "null") {
                    value = null;
                }
                if (!current) {
                    output[key] = value;
                } else {
                    output[current][key] = value;
                }
                continue;
            }
        }
        return output;
    }
}