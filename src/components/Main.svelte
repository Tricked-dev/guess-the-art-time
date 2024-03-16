<script>
  import { decode } from "cborg";
  import { onMount } from "svelte";
  let quizzQuestions = [];

  const questionCount = 20;

  let dateCache = {};

  async function fetchData(retries = 5) {
    try {
      const req = await fetch(
        `/data/encoded-${(Math.random() * 10) | 0}.bin`
      ).then((r) => r.arrayBuffer());

      return decode(new Uint8Array(req));
    } catch (e) {
      console.log("Error while retrieving data");
      if (retries > 0) {
        console.log("Retrying...");
        return fetchData(retries - 1);
      }
    }
  }

  onMount(async () => {
    const res = await fetchData();
    const itemSet = getRandomParsableArray(res, questionCount * 50);

    // There is 20x of things from the 18th century than from anything else so we do this to make some more variation
    const grouped = groupHighsAndLows(itemSet).filter((x) => x);

    const inclusiveList = [];

    for (let list of grouped) {
      if (!list) continue;
      inclusiveList.push(
        ...shuffleArray(list).slice(0, (questionCount / grouped.length) * 10)
      );
    }

    const items = shuffleArray(inclusiveList).slice(0, questionCount);

    // item:
    // index 0: quizz question (date)
    // index 1: name
    // index 2: id (used for image)
    // index 3: culture
    for (const [item, index] of items.map((c, index) => [c, index])) {
      let answers = [...items];
      answers.splice(index, 1);
      quizzQuestions.push({
        image: `https://media.getty.edu/iiif/image/${item[2]}/full/!500,500/0/default.jpg`,
        name: item[1],
        options: shuffleArray([
          ...getRandomNonDuplicateItems(
            [
              ...new Set(
                filterDates(
                  item[0],
                  inclusiveList
                    .filter((i) => i[1] !== item[1])
                    .map((x) => x[0].trim())
                )
              ),
            ],
            3
          ),
          item[0].trim(),
        ]),
        answer: item[0],
        culture: item[3],
      });
    }

    quizzQuestions = [...quizzQuestions];

    // clear date cache to save some memory
    dateCache = {};
  });

  function groupHighsAndLows(array) {
    const grouped = [];

    array.forEach(([date, ...rest]) => {
      const [low, high] = parseDateRange(date);
      const middle = Math.floor((low + high) / 2);
      const group = Math.floor(middle / 100);

      if (!grouped[group]) {
        grouped[group] = [];
      }

      grouped[group].push([date, ...rest]);
    });

    return grouped;
  }

  function filterDates(primaryDate, otherDates) {
    const [primaryStartDate, primaryEndDate] = parseDateRange(primaryDate);

    const filteredOtherDates = otherDates.filter((date) => {
      const [start, end] = parseDateRange(date);
      return end < primaryStartDate || start > primaryEndDate;
    });

    return filteredOtherDates;
  }

  function parseDateRange(dateStr) {
    if (dateCache[dateStr]) {
      return dateCache[dateStr];
    }
    const patterns = [
      /^(\d{4})$/, // e.g., 1885
      /^about (\d{4})\u2013(\d{4})$/, // e.g., about 1855–1875
      /^about (\d{4})$/, // e.g., about 1865
      /^(\d{4})s$/, // e.g., 1860s
      /^about (\d{4})0s$/, // e.g., about 1850s
      /^about (\d{4})s$/, // e.g., about 1850s
      /^A\.D\. (\d{3})\u2013(\d{3})$/, // e.g., A.D. 251–253
      /^about (\d{4})\u2013(\d{4})0s$/, // e.g., about 1875–1890s
      /^about (\d{4})\u2013(\d{4})s$/, // e.g., about 1875–1890s
      /^about (\d{3,4})$/, // e.g., about 826
      /^(\d{4})\u2013(\d{4})$/, // e.g., 1907–1943
      /^(\d{3,4})s\u2013(\d{3,4})s$/, // e.g., 1907–1943
    ];

    for (const pattern of patterns) {
      const match = dateStr.match(pattern);
      if (match) {
        const [_, start, end] = match;
        const startDate = start ? parseInt(`${start}`) : null;
        const endDate = end ? parseInt(`${end}`) : startDate;
        dateCache[dateStr] = [startDate, endDate];
        return [startDate, endDate];
      }
    }

    return [null, null];
  }

  function shuffleArray(arr) {
    const shuffledArray = arr.slice();
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }
    return shuffledArray;
  }

  function getRandomNonDuplicateItems(arr, numItems) {
    const shuffledArray = shuffleArray(arr);
    return shuffledArray.slice(0, numItems);
  }

  function getRandomParsableArray(arr, numItems) {
    const shuffledArray = shuffleArray(arr).slice(0, numItems * 5);
    const filtered = shuffledArray.filter(
      (x) => parseDateRange(x[0])[0] != null
    );
    return filtered.slice(0, numItems);
  }

  let answers = [];
  let questionIndex = 0;
  let picked = "";

  function calculateOverallPercentage(answers) {
    let correctAnswers = answers.filter((answer) => answer[0]).length;
    return (correctAnswers / answers.length) * 100;
  }

  function calculateCategoryPercentages(answers) {
    let categoryPercentages = {};
    let categoryCounts = {};

    answers.forEach((answer) => {
      let category = answer[1];
      if (!categoryCounts.hasOwnProperty(category)) {
        categoryCounts[category] = 0;
      }
      categoryCounts[category]++;
      if (!categoryPercentages.hasOwnProperty(category)) {
        categoryPercentages[category] = 0;
      }
      if (answer[0]) {
        categoryPercentages[category]++;
      }
    });

    for (let category in categoryPercentages) {
      categoryPercentages[category] =
        (categoryPercentages[category] / categoryCounts[category]) * 100;
    }

    return categoryPercentages;
  }

  let confirm = false;
</script>

<main
  class="max-w-[50rem] mx-auto mt-4 block p-6 bg-gray-100 border border-gray-200 rounded-lg shadow"
>
  <h1 class="text-center text-gray-800 font-bold text-3xl">Guess the date</h1>

  <div class="min-h-96 p-2" class:hidden={questionIndex !== questionCount}>
    <h2 class="text-center text-xl text-bold">Results</h2>
    {#if answers.length == 0}
      <p class="text-gray-900 text-center">
        Nothing to show here you didn't even get past the first question
      </p>
    {:else}
      <p>
        Percentage of Correct Answers: {calculateOverallPercentage(
          answers
        ).toFixed(0)}%
      </p>

      <div class="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div
          class="bg-blue-600 h-2.5 rounded-full"
          style="width: {calculateOverallPercentage(answers).toFixed(0)}%"
        ></div>
      </div>

      <h2>Category Performance</h2>
      <ul class="max-w-md space-y-1 text-gray-500 list-disc list-inside">
        {#each Object.entries(calculateCategoryPercentages(answers)) as [category, percentage]}
          <li>
            <span class="font-semibold text-gray-900">{category}</span>
            {percentage.toFixed(0)}%
          </li>
        {/each}
      </ul>
    {/if}
    <button
      type="button"
      on:click={() => {
        window.location.reload();
      }}
      class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 mx-auto mt-4"
      >Retry</button
    >
  </div>

  <div
    class="flex justify-center min-h-96 p-6"
    class:hidden={questionIndex == questionCount}
  >
    {#each quizzQuestions as q, index}
      {#if index === questionIndex}
        <img
          src={q.image}
          alt={q.name}
          fetchpriority="high"
          loading="eager"
          class="bg-gray-300 rounded-xl drop-shadow-lg"
        />
      {/if}
    {/each}
  </div>
  <div class:hidden={questionIndex == questionCount}>
    <ul class="grid w-full gap-6 md:grid-cols-2">
      {#each quizzQuestions[questionIndex]?.options ?? [] as option, index}
        <li>
          <input
            type="radio"
            id="answer-{option}"
            name="answer"
            value={option}
            class="hidden peer"
            required
            on:click={() => {
              picked = option;
            }}
            checked={picked === option}
            disabled={!!picked}
          />
          <label
            for="answer-{option}"
            class={`inline-flex items-center justify-between w-full p-5 text-gray-500  border border-gray-200 rounded-lg cursor-pointer  
                ${picked === option ? "ring-2 ring-blue-500" : ""}
                ${
                  option === quizzQuestions[questionIndex]?.answer && picked
                    ? "bg-green-500 text-white"
                    : picked == option
                      ? "bg-red-500 text-white"
                      : "bg-white drop-shadow-md hover:filter-none hover:shadow-inner hover:text-gray-600"
                }
            `}
          >
            <div class="block">
              <div class="w-full text-lg font-semibold">{option}</div>
            </div>
          </label>
        </li>
      {/each}
    </ul>

    <div class="py-6 min-h-14 flex">
      <button
        type="button"
        on:click={() => {
          if (!picked && !confirm) return (confirm = true);
          if (!picked && confirm) return (questionIndex = questionCount);
          confirm = false;
          answers = [
            ...answers,
            [
              picked === quizzQuestions[questionIndex]?.answer,
              quizzQuestions[questionIndex]?.culture,
            ],
          ];

          picked = "";
          questionIndex++;
        }}
        class="text-white {!picked
          ? 'bg-red-500 hover:bg-red-700'
          : 'bg-blue-700 hover:bg-blue-800'} w-32 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 drop-shadow-md"
        >{picked ? "Continue" : confirm ? "You sure" : "Give Up"}</button
      >
      <p class="text-right ml-auto">
        {questionIndex + 1}/{quizzQuestions.length}
      </p>
    </div>
  </div>
</main>

<footer class="max-w-[50rem] mx-auto text-gray-500 group">
  <p>
    All images and data is sourced from <a
      href="https://getty.edu"
      target="_blank"
      rel="noreferrer">Getty</a
    >
  </p>
  <p>
    Created by <a
      href="https://github.com/tricked-dev"
      target="_blank"
      rel="noreferrer">Tricked-dev</a
    >
  </p>
  <p class="group-hover:opacity-100 opacity-0 duration-500">
    Source code on <a
      href="https://github.com/Tricked-dev/guess-the-art-time"
      target="_blank"
      rel="noreferrer">GitHub</a
    >
  </p>
</footer>

<style>
  a {
    @apply text-blue-500 underline hover:text-blue-600;
  }
</style>
