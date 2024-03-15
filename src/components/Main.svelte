<script>
  import { encode, decode } from "cborg";
  import { onMount } from "svelte";
  let quizzQuestions = [];

  const questionCount = 20;

  onMount(async () => {
    const req = await fetch("/encoded.bin").then((r) => r.arrayBuffer());

    const res = decode(new Uint8Array(req));

    const items = getRandomNonDuplicateItems(res, questionCount);

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
                items.filter((i) => i[1] !== item[1]).map((x) => x[0].trim())
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
  });

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
  <h1 class="text-center text-gray-900 font-bold text-xl">Guess the date</h1>

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
    class="flex justify-center min-h-96 p-2"
    class:hidden={questionIndex == questionCount}
  >
    {#each quizzQuestions as q, index}
      {#if index === questionIndex}
        <img
          src={q.image}
          alt={q.name}
          fetchpriority="high"
          loading="eager"
          class="bg-gray-300 rounded-xl"
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
                      : "bg-white hover:bg-gray-100 hover:text-gray-600"
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

    <div class="py-2 min-h-14 flex">
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
          : 'bg-blue-700 hover:bg-blue-800'} w-32 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
        >{picked ? "Continue" : confirm ? "You sure" : "Give Up"}</button
      >
      <p class="text-right ml-auto">
        {questionIndex + 1}/{quizzQuestions.length}
      </p>
    </div>
  </div>
</main>

<footer class="max-w-[50rem] mx-auto text-gray-500">
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
</footer>

<style>
  a {
    @apply text-blue-500 underline hover:text-blue-600;
  }
</style>