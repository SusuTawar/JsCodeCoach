(() => {
  window.addEventListener("load", async () => {
  	const { request } = await import("https://cdn.pika.dev/@octokit/request");
    const code = document.querySelector("code");
    code.addEventListener("blur", (e) => pretty(e.target));
    const selectChallenges = document.querySelector("#sl-ch");
    const challenges = await fetchTests();
    let ch;

    selectChallenges.addEventListener("change", async () => {
      if (!challenges) return;
      cha = bfind(challenges, (a, b) => {
        return b.id - a.id;
      });

      const ch = await axios({
        method: "get",
        url: c.download_url,
      });
      if (ch.status >= 300) return false;
			for (const k in ch) {
        if (ch[k] instanceof Object)
          for (const l in ch[k]) {
            const nl = DOMPurify.sanitize(l);
            const nlv = cha[k][l];
            delete ch[k][l];
            ch[k][nl] = nlv;
					}
        else ch[k] = DOMPurify.sanitize(ch[k]);
      }

      if (!ch) return alert("Challenge not found");
      placeAll(".cr-title", "innerText", ch.title);
      placeAll(".cr-desc", "innerText", ch.description);
      placeAll(".cr-task", "innerText", ch.task);
      placeAll(".cr-inp", "innerText", ch.input);
      placeAll(".cr-out", "innerText", ch.output);
      placeAll(".cr-example", "innerText", ch.example);
      let funText = `function ${ch.functionName}(`;
      if (Array.isArray(ch.paramsName))
        for (let i = 0; i < ch.paramsName.length; i++) {
          funText += ch.paramsName[i];
          funText += i == ch.paramsName.length - 1 ? ")" : ", ";
        }
      else funText += `( ${ch.paramsName} )`;
      funText += `{\n    \/*code here*\/\n}`;
      code.innerText = funText;

			pretty(code);
    });

    if (challenges)
      for (const challenge of challenges) {
        const option = document.createElement("option");
        option.value = challenge.id;
        option.innerText = DOMPurify.sanitize(
          challenge.filename
            .slice(0, challenge.lastIndexOf("."))
            .replace(/_/g, " ")
        );
        selectChallenges.appendChild(option);
      }

    function placeAll(s, k, v) {
      for (const el of document.querySelectorAll(s)) el[k] = v;
    }

    function pretty(el) {
      try {
        const n = prettier.format(el.innerText, {
          parser: "babel",
          plugins: prettierPlugins,
        });
        el.innerText = n;
      } catch (e) {
        console.log(JSON.stringify(e.loc));
      } finally {
        hljs.highlightBlock(el);
      }
    }

    //==========================
    // Listener

    const nav = document.querySelector("nav");
    const btns = nav.querySelectorAll("button");
    for (const btn of btns) {
      const b = btn;
      btn.addEventListener("click", () => {
        for (const m_btn of btns) {
          m_btn.classList.remove("inactive");
          m_btn.classList.remove("active");
          document
            .querySelector(m_btn.dataset.section)
            .classList.remove("active");
        }
        b.classList.add("active");
        document.querySelector(b.dataset.section).classList.add("active");
        if (b.dataset.section.endsWith("info")) {
          document.querySelector("#b-run").classList.add("inactive");
        }
        if (b.dataset.section.endsWith("code")) code.focus();
        if (b.dataset.section.endsWith("run")) evaluate();
      });
    }

    async function evaluate() {
      const us = document.querySelector("#uscript");
      const usn = document.createElement("script");
      usn.id = "uscript";
      usn.innerText = code.innerText;
      const p = us.parentElement;
      p.removeChild(us);
      p.appendChild(usn);

      mocha.setup({
        ui: "bdd",
        reporter: CustomReporter,
        cleanReferencesAfterRun: false,
      });
      mocha.checkLeaks();

      describe(ch.title, () => {
        for (const test in ch.testCase) {
          it(test, (done) => {
            for (const cases of ch.testCase[test]) {
              const res = window[ch.functionName](...cases.input);
              chai.expect(res).to.equal(cases.output);
            }
            done();
          });
        }
      });

      mocha.run();
    }

    let report = {
      totalTest: 0,
      totalPass: 0,
      totalFail: 0,
      pass: [],
      fail: [],
      allTest: [],
      listener: [],

      set tests(v) {
        this.totalTest = v;
        //if(v>0)
        for (const l of this.listener) l();
      },

      get tests() {
        return this.totalTest;
      },

      addListener: function (fun) {
        this.listener.push(fun);
      },
    };

    report.addListener(() => {
      mocha.unloadFiles();
      mocha.dispose();
    });

    function appendTestResult(k, status) {
      const srun = document.querySelector("#s-run");
      const asrun = srun.querySelector("article");
      const card = document.createElement("div");
      card.classList.add("card");
      const h1 = document.createElement("h1");
      h1.innerHTML = status ? "&#10004; Success" : "&#10008; Failed";
      const div = document.createElement("div");
      if (!status) {
        card.classList.add("red");
      }
      const h2 = document.createElement("h2");
      h2.innerText = k.title;
      const p = document.createElement("p");
      p.innerHTML = `Case: ${k.title} (${k.duration}ms)`;
      //if(!status)
      //p.innerText += `\nError: ${k.err}`
      div.appendChild(h2);
      div.appendChild(p);

      card.appendChild(h1);
      card.appendChild(div);
      return asrun.appendChild(card);
    }

    function CustomReporter(runner) {
      let pass = 0;
      let fail = 0;
      report.pass = [];
      report.fail = [];
      report.allTest = [];
      runner.on("suite", () => {
        const srun = document.querySelector("#s-run");
        const asrun = srun.querySelector("article");
        while (asrun.firstChild) asrun.removeChild(asrun.firstChild);
      });
      runner.on("pass", (test) => {
        pass++;
        const t = {
          title: test.title,
          duration: test.duration,
        };
        report.pass.push(t);
        report.allTest.push({
          ...t,
          status: "pass",
        });
        appendTestResult(t, true);
      });
      runner.on("fail", (test, err) => {
        fail++;
        const t = {
          title: test.title,
          err: err.message,
          duration: test.duration,
        };
        report.fail.push(t);
        report.allTest.push({
          ...t,
          status: "fail",
        });
        appendTestResult(t, false);
      });
      runner.on("end", () => {
        report.totalPass = pass;
        report.totalFail = fail;
        report.tests = pass + fail;
      });
    }
  });

  async function fetchTests(owner = "SusuTawar", repo = "JsCodeCoach") {
    try {
      const result = await request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner,
          repo,
          path: "challenges",
        }
      );
      const n = now();
      return result
        .map((c) => {
          return {
            id: Date.now - n,
            link: c.download_url,
            filename: name,
          };
          /*const ch = await axios({
            method: "get",
            url: c.download_url,
          });
          if (ch.status >= 300) return false;

          cha = ch.data;

          for (const k in cha) {
            if (cha[k] instanceof Object)
              for (const l in cha[k]) {
                const nl = DOMPurify.sanitize(l);
                const nlv = cha[k][l];
                delete cha[k][l];
                cha[k][nl] = nlv;
              }
            else cha[k] = DOMPurify.sanitize(cha[k]);
          }
          cha.id = Date.now();
          return cha;*/
        })
        .filter((c) => c);
    } catch (e) {
      alert(`cannot fetch the challenges from ${owner}/${repo}`);
      return false;
    }
  }

  function bfind(fn, arr, item) {
    let start = 0;
    let end = arr.length;
    let pivot = Math.ceil((start + end) / 2);
    while (start <= end) {
      const f = fn(arr[pivot], item);
      if (f > 0) {
        start = pivot + 1;
        pivot = Math.ceil((start + end) / 2);
      } else if (f < 0) {
        end = pivot - 1;
        pivot = Math.floor((start + end) / 2);
      } else {
        return arr[pivot];
      }
    }
    return false;
  }
})();
