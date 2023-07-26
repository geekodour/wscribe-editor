<script lang="ts">
  export let errList;
</script>

<div>
  {#if errList.length > 0}
    Errors:
    <ul class="list-disc list-inside">
      {#each errList as e}
        <li>{e}</li>
      {/each}
    </ul>
  {/if}
</div>
