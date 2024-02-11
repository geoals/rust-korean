function IndexPopup() {
  return (
    <div
      style={{
        padding: 16,
      }}
    >
      <h2>HMR is working 5</h2>
      <button
        onClick={async () => {
          const result = await window.fetch("http://localhost:4000/analyze", {
            method: "POST",
            body: "그러니까 뭐라고 소개를 했냔 말입니다!다언어판 가운데 하나로서",
          }).then((resp) => resp.json());

          console.log(result);
        }}
      >
        analyze
      </button>
    </div>
  );
}

export default IndexPopup;
