(() => {
  window.addEventListener("load", async () => {
    // import to access Github Rest API
    const { request } = await import("https://cdn.pika.dev/@octokit/request");

    // Github repo
    const owner = "SusuTawar";
    const repo = "JsCodeCoach";

    // prettify code when lost focus
    const code = document.querySelector("code");
    code.addEventListener("blur", (e) => pretty(e.target));

    // take all challenges from github
    const challenges = await fetchTests(request, owner, repo);

    // variable for chosen challenge
    let ch;

    // populate dropdown with challanges
    const selectChallenges = document.querySelector("#sl-ch");
    if (challenges)
      for (const challenge of challenges) {
        const option = document.createElement("option");
        option.value = challenge.id;
        option.innerText = DOMPurify.sanitize(
          challenge.filename
            .slice(0, challenge.filename.lastIndexOf("."))
            .replace(/_/g, " ")
            .replace(/(^[a-z]|\s([a-z]))/g, (l) => l.toUpperCase())
        );
        selectChallenges.appendChild(option);
      }

    // to populate ui with challenge description
    function placeAll(s, k, v) {
      for (const el of document.querySelectorAll(s)) el[k] = v;
    }

    // to prettify the editor
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

    // create listenter for button navigation
    for (const btn of btns) {
      const b = btn;
      btn.addEventListener("click", () => {
        if (b.dataset.section.endsWith("info")) {
          document.querySelector("#b-run").classList.add("inactive");
          swap();
        }
        if (b.dataset.section.endsWith("code")) {
          // only move to this screen after challenge
          // has been chosen
          if (parseInt(selectChallenges.value) >= 0) {
            swap();
            code.focus();
          } else alert("choose challenge first!");
        }
        if (b.dataset.section.endsWith("run")) {
          swap();
          evaluate();
        }

        // to move between pages
        function swap() {
          for (const m_btn of btns) {
            m_btn.classList.remove("inactive");
            m_btn.classList.remove("active");
            document
              .querySelector(m_btn.dataset.section)
              .classList.remove("active");
          }
          b.classList.add("active");
          document.querySelector(b.dataset.section).classList.add("active");
        }
      });
    }

    selectChallenges.addEventListener("change", async (e) => {
      if (!challenges) return;
      if (Number(e.target.value) < 0) {
        ch = {};
        placeAll(".cr-title", "innerText", "Not Available");
        placeAll(".cr-desc", "innerText", "Not Available");
        placeAll(".cr-task", "innerText", "Not Available");
        placeAll(".cr-inp", "innerText", "Not Available");
        placeAll(".cr-out", "innerText", "Not Available");
        placeAll(".cr-example", "innerText", "Not Available");
        return;
      }
      cha = challenges.find((v) => v.id == e.target.value);
      const req = await axios({
        method: "GET",
        url: cha.link,
      });
      if (req.status >= 400) return false;
      ch = req.data;
      for (const k in ch) {
        if (ch[k] instanceof Object)
          for (const l in ch[k]) {
            const nl = DOMPurify.sanitize(l);
            const nlv = ch[k][l];
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

      for (const i in ch.testCase) {
        if (
          typeof ch.testCase[i] === "string" ||
          ch.testCase[i] instanceof String
        ) {
          try {
            const res = await request(
              "GET /repos/{owner}/{repo}/contents/{path}",
              {
                owner,
                repo,
                path: `test_file/${ch.testCase[i]}`,
                responseType: "text",
              }
            );
            if (res.status < 400) {
              const d = atob(res.data.content)
                .split(/(\r|\n|\r\n)/)
                .filter((t) => /[^\s]+/.test(t));
              const tests = [];
              for (let j = 0; j < d.length; j += 2) {
                const test = {};
                test.output = !isNaN(d[j + 1]) ? Number(d[j + 1]) : d[j + 1];
                test.input = d[j].split(/\s+/).map((a) => {
                  return !isNaN(a) ? Number(a) : a;
                });
                tests.push(test);
                ch.testCase[i] = tests;
              }
            } else {
              alert(`Cannot get file for '${i}'`);
              delete ch.testCase[i];
            }
          } catch (e) {
            console.error(e);
            alert("Cannot get test files");
          }
        }
      }
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
      div.appendChild(h2);
      div.appendChild(p);

      card.appendChild(h1);
      card.appendChild(div);
      return asrun.appendChild(card);
    }

    function CustomReporter(runner) {
      runner.on("suite", () => {
        const srun = document.querySelector("#s-run");
        const asrun = srun.querySelector("article");
        while (asrun.firstChild) asrun.removeChild(asrun.firstChild);
      });
      runner.on("pass", (test) => {
        const t = {
          title: test.title,
          duration: test.duration,
        };
        appendTestResult(t, true);
      });
      runner.on("fail", (test, err) => {
        const t = {
          title: test.title,
          err: err.message,
          duration: test.duration,
        };
        appendTestResult(t, false);
      });
    }
  });

  async function fetchTests(request, owner, repo) {
    try {
      const result = await request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner,
          repo,
          path: "challenges",
        }
      );
      const n = Date.now();
      return (
        await Promise.all(
          result.data
            .map((c) => {
              return {
                id: Date.now() - n,
                link: c.download_url,
                filename: c.name,
              };
            })
            .filter((c) => c)
        )
      ).sort((a, b) => {
        a.id - b.id;
      });
    } catch (e) {
      console.error(e);
      alert(`cannot fetch the challenges from ${owner}/${repo}`);
      return false;
    }
  }
})();
