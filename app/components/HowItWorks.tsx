const steps = [
  {
    number: "01",
    title: "Discover",
    description:
      "Browse listings from students and find items that fit what you need.",
  },
  {
    number: "02",
    title: "Connect",
    description:
      "Reach out to the seller and ask questions before making a decision.",
  },
  {
    number: "03",
    title: "Exchange",
    description:
      "Arrange a convenient meeting and complete your exchange with confidence.",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-3xl bg-[#765c68] px-6 py-14 sm:px-10 lg:px-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ebc8ba]">
            Simple by design
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#fffdfc] sm:text-4xl">
            How UniMarket works
          </h2>

          <p className="mt-4 leading-7 text-[#f6f1ea]/80">
            A simple way for students to discover useful items, connect with
            other students, and make exchanges within their campus community.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="border-t border-[#ebc8ba]/30 pt-6"
            >
              <span className="text-sm font-bold text-[#ebc8ba]">
                {step.number}
              </span>

              <h3 className="mt-4 text-xl font-semibold text-[#fffdfc]">
                {step.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#f6f1ea]/75">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}