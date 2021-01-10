function* fuzzySieve(data, query) {
    re = new FuzzyRegExp(query);
    let multiMatches = [];
    let fuzzyMatches = [];
    let count = 0;

    for (const item of data) {
        const m = re.exec(item);
        if (m.match) {
            let li = document.createElement("li");
            for (const group of m.groups) {
                let span = document.createElement("span");
                if (group.match) {
                    span.setAttribute("class", "fuzzy-select-inline-match");
                }
                span.textContent = group.value;
                li.appendChild(span);
            }
            switch (m.type) {
                case "exact":
                    yield li; ++count; break;
                case "multi":
                    multiMatches.push(li); break;
                default:
                    fuzzyMatches.push(li);
            }
        }
    }

    for (let i = 0; i < multiMatches.length && count < 20; ++i) {
        yield multiMatches[i];
        ++count;
    }

    for (let i = 0; i < fuzzyMatches.length && count < 20; ++i) {
        yield fuzzyMatches[i];
        ++count;
    }
}

let processes = new Set();

window.addEventListener("load", e => {
    ajaxUtils.makeAjaxCall(
        "https://oekobilanz.fkretlow.vercel.app/api?query=processes:format=json", "GET", true
    ).then(json => {
        json.data.forEach(item => {
            processes.add(item.name);
        });
    });
    const input = document.querySelector("#select-input");
    const output = document.querySelector("#select-output");
    const handler = new FuzzySelect(input, output, processes, fuzzySieve, "select process");
});
