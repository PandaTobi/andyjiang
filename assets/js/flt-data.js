(function () {
  "use strict";

  const VIDEO_ID = "9f-hGSh8lF0";
  const SLIDES_FOLDER = "https://drive.google.com/drive/folders/1Yt3MUcYmDb-w86wWnuT-yW2vRDSRiUXd";
  const slideFiles = {
    ch1: { id: "1f7bmIU8vS59cBp09KBhQaQPRT5lMp8a6", title: "Chapter 1 — Basics" },
    ch2: { id: "1j5fS0SJM1hr7HIHC4wKUpnJTxRUMTaWD", title: "Chapter 2 — Linear Algebra" },
    ch3: { id: "1CrrV2HR1AQKtdNobX08ZoEaxk7B7u-6H", title: "Chapter 3 — Abstract Algebra" },
    ch4: { id: "1S0wL9UT96cybvRKidCTZGn1kJgE10zOW", title: "Chapter 4 — Elliptic Curves" },
    ch5: { id: "1KDvPxix6y-VNKzLHyOAdu0q9LO2PkhDL", title: "Chapter 5 — Modular Forms" },
    ch6: { id: "1r4kDsBwdIL7y_2qikScgNQRishKKcRXD", title: "Chapter 6 — The Endgame" },
    flt3: { id: "1OMKpjfLJraiVs-T5hNIe2AKxb0cEltcU", title: "FLT (n = 3) full proof" },
    flt4: { id: "1dlCyKPP5XRBSdsFOEnAwCVsk8sRV1xhI", title: "FLT (n = 4) full proof" }
  };

  function source(file, pages, time, note) {
    return { file, pages, time, note };
  }

  function term(name, definition, page, time) {
    return { name, definition, page, time };
  }

  function question(type, prompt, answer, choices, solution, page, time) {
    return { type, prompt, answer, choices, solution, page, time };
  }

  const chapters = [
    { id: "foundations", number: 1, title: "Foundations & classical cases", subtitle: "Arithmetic language, infinite descent, and complex analysis" },
    { id: "linear-algebra", number: 2, title: "Linear algebra", subtitle: "Matrices, vector spaces, and the spectral viewpoint" },
    { id: "abstract-algebra", number: 3, title: "Abstract algebra", subtitle: "Groups, rings, Galois representations, and p-adic numbers" },
    { id: "elliptic-curves", number: 4, title: "Elliptic curves", subtitle: "Geometry that carries arithmetic information" },
    { id: "modular-forms", number: 5, title: "Modular forms", subtitle: "Symmetric analytic functions and Hecke arithmetic" },
    { id: "endgame", number: 6, title: "The endgame", subtitle: "Frey, Ribet, Wiles, and the final contradiction" }
  ];

  const units = [
    {
      id: "number-language", chapterId: "foundations", title: "The language of number theory",
      summary: "Sets, divisibility, congruence, and coprimality—the grammar used everywhere later.",
      source: source("ch1", "2–6", 319, "These slides establish the notation and elementary divisibility facts used throughout the lecture."),
      objectives: ["Read set and divisibility notation", "Compute congruences and gcds", "Use Euclid's lemma with coprime factors"],
      intro: "The proof's machinery becomes sophisticated, but its claims are still sentences about integers. This unit fixes the language: which number system we are in, what it means to divide, and how coprimality lets information move between factors.",
      sections: [
        { title: "Number systems and products", body: "The familiar inclusions ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ ⊂ ℂ let us enlarge the setting without forgetting the integers we started with. A Cartesian product A × B records ordered pairs; later, products such as (ℤ/nℤ)² describe two coordinates at once." },
        { title: "Divisibility becomes congruence", body: "The statement a ≡ b (mod n) means exactly n | (a − b). Congruences compress divisibility into a calculational language: powers often have only a few possible residues, making impossible equations visible." },
        { title: "Coprime factors separate", body: "If gcd(a,c)=1 and a divides bc, Euclid's lemma gives a | b. More generally, when pairwise coprime factors multiply to a perfect k-th power, unique prime factorization forces every factor to be a k-th power." }
      ],
      terms: [
        term("a | b", "There is an integer k with b = ak.", 5),
        term("a ≡ b (mod n)", "The modulus n divides a − b.", 5),
        term("gcd(a,b)=1", "The integers a and b are coprime; their only positive common divisor is 1.", 6),
        term("Cartesian product", "A × B is the set of ordered pairs (a,b) with a ∈ A and b ∈ B.", 3),
        term("ℚ", "The field of ratios a/b with a,b ∈ ℤ and b ≠ 0.", 2),
        term("Euclid's lemma", "If gcd(a,b)=1 and a divides bc, then a divides c.", 6)
      ],
      questions: [
        question("numeric", "What is the least nonnegative residue of 5³ modulo 7?", "6", null, ["Compute 5² ≡ 25 ≡ 4 (mod 7).", "Then 5³ ≡ 4·5 = 20 ≡ 6 (mod 7)."], 5, 640),
        question("multi", "Select every integer congruent to 2 modulo 5.", ["−3", "12", "27"], ["−3", "7", "12", "20", "27"], ["Numbers congruent to 2 differ from 2 by a multiple of 5.", "−3−2=−5, 12−2=10, and 27−2=25 are multiples of 5."], 5, 640)
      ]
    },
    {
      id: "descent-small-exponents", chapterId: "foundations", title: "Infinite descent for n = 3 and n = 4",
      summary: "How a hypothetical smallest solution is transformed into a still smaller one.",
      source: source("ch1", "7–10", 1021, "The slides state the key lemmas; the folder also contains the complete n=3 and n=4 descent proofs."),
      objectives: ["Explain the logic of infinite descent", "Recognize primitive solutions", "Connect square-area triangles to the n=4 case"],
      intro: "Long before Wiles, the exponents 3 and 4 were conquered by descent. Assume a solution exists, choose a minimal one, then use its arithmetic structure to manufacture a smaller solution of the same kind. Positive integers cannot descend forever.",
      sections: [
        { title: "Primitive first", body: "A common divisor can be removed from a homogeneous Fermat equation. The remaining primitive solution is pairwise coprime, sharply limiting which primes can occur in several factors." },
        { title: "The descent engine", body: "Minimal-counterexample arguments are constructive contradictions: minimality supplies a smallest positive parameter, while factorization and coprimality build another valid parameter below it." },
        { title: "Why n = 4 follows from triangles", body: "Starting from a primitive solution x⁴+y⁴=z⁴, the full proof factors z⁴−y⁴ and separates coprime fourth-power factors. It ultimately constructs a right triangle with sides b², 2a², z and square area (ab)². Fermat's triangle lemma rules this out by descent." }
      ],
      terms: [
        term("primitive solution", "An integer solution whose entries have greatest common divisor 1.", 7, 1021),
        term("infinite descent", "A contradiction obtained by repeatedly constructing a smaller positive-integer solution.", 9, 1669),
        term("minimal counterexample", "A hypothetical counterexample chosen to minimize a positive size parameter.", 9, 1669),
        term("pairwise coprime", "Every pair among the integers has greatest common divisor 1.", 7, 1021),
        term("Pythagorean triple", "Integer side lengths a,b,c satisfying a²+b²=c².", 9, 1669),
        term("Eisenstein integers", "Numbers a+bω with ω³=1 and ω≠1; a UFD used in the n=3 proof.", 7, 1021)
      ],
      questions: [
        question("single", "What creates the contradiction in an infinite-descent proof?", "A smallest positive solution produces a smaller positive solution", ["The variables become negative", "A smallest positive solution produces a smaller positive solution", "Every congruence becomes equality", "There are finitely many primes"], ["Assume at least one positive solution exists and select a smallest one.", "The descent construction yields another positive solution with a smaller size parameter, contradicting the choice."], 9, 1669),
        question("single", "Why may a common gcd usually be divided out of xⁿ+yⁿ=zⁿ?", "The equation is homogeneous of degree n", ["The equation is linear", "All primes are units", "The equation is homogeneous of degree n", "Congruence preserves size"], ["If d divides x,y,z, write x=dx₀, y=dy₀, z=dz₀.", "Every term contains dⁿ, so canceling it leaves x₀ⁿ+y₀ⁿ=z₀ⁿ."], 7, 1021)
      ]
    },
    {
      id: "complex-analysis", chapterId: "foundations", title: "Complex numbers, derivatives, and Fourier expansion",
      summary: "The analytic vocabulary needed to define modular forms later.",
      source: source("ch1", "11–18", 2339, "This lecture segment moves from multivariable calculus to holomorphic functions and q-expansions."),
      objectives: ["Use Euler's formula and roots of unity", "Distinguish real and complex differentiability", "Read a Fourier or q-expansion"],
      intro: "Modular forms live on the complex upper half-plane. To meet them, we need complex geometry, a stringent notion of differentiability, and Fourier series for periodic functions.",
      sections: [
        { title: "From coordinates to complex numbers", body: "The complex number z=x+iy is a point (x,y). Euler's formula eⁱᶿ=cos θ+i sin θ turns rotations into multiplication and lists the n-th roots of unity as e²πik/n." },
        { title: "Holomorphy is rigid", body: "For f:ℂ→ℂ, the derivative limit must agree as the complex increment h approaches from every direction. A function differentiable on an open set is holomorphic—far more constrained than a merely real-differentiable function." },
        { title: "Periodicity produces q-series", body: "If f(z+1)=f(z), setting q=e²πiz turns a Fourier expansion into f(z)=Σ aₙqⁿ. This q-expansion will become the arithmetic fingerprint of a modular form." }
      ],
      terms: [
        term("Euler's formula", "eⁱᶿ = cos θ + i sin θ.", 14),
        term("n-th root of unity", "A complex number z satisfying zⁿ=1.", 15),
        term("holomorphic", "Complex differentiable at every point of an open set.", 17),
        term("upper half-plane ℍ", "The complex numbers z with Im(z)>0.", 18),
        term("q-parameter", "q=e²πiz, used to rewrite a period-1 Fourier series as a power series.", 18),
        term("partial derivative", "The derivative obtained by varying one coordinate while holding the others fixed.", 12)
      ],
      questions: [
        question("single", "Which list is exactly the cube roots of unity?", "1, e²πi/3, e⁴πi/3", ["1, i, −1", "1, e²πi/3, e⁴πi/3", "0, 1, −1", "eπi/3, e²πi/3, eπi"], ["The n-th roots are e²πik/n for k=0,…,n−1.", "For n=3, use k=0,1,2 to obtain 1, e²πi/3, e⁴πi/3."], 15, 2920),
        question("numeric", "For z = 2 + 3i, what is Im(z)?", "3", null, ["Write z=x+iy.", "The coefficient of i is the imaginary part, so Im(z)=3."], 16, 3050)
      ]
    },
    {
      id: "matrices", chapterId: "linear-algebra", title: "Matrices, systems, and determinants",
      summary: "Encode linear systems and recognize invertible transformations.",
      source: source("ch2", "2–8", 4023, "The first linear-algebra segment introduces matrices through GLₙ and SLₙ."),
      objectives: ["Multiply small matrices", "Use determinants to test invertibility", "Distinguish GLₙ from SLₙ"],
      intro: "A Galois representation will eventually turn a symmetry into an invertible 2×2 matrix. This unit builds the matrix language needed to read that sentence.",
      sections: [
        { title: "Matrices are composable actions", body: "An m×n matrix sends n coordinates to m coordinates. Matrix multiplication matches composition: dimensions must line up, order matters, and associativity lets several maps compose unambiguously." },
        { title: "Determinants detect reversibility", body: "A square matrix is invertible exactly when its determinant is nonzero. Determinants multiply, so invertible matrices are closed under products and inverses." },
        { title: "Two important matrix groups", body: "GLₙ(F) contains every invertible n×n matrix over F. SLₙ(F) is the subgroup with determinant 1. These are the natural targets for many representations." }
      ],
      terms: [
        term("m×n matrix", "A rectangular array with m rows and n columns.", 2),
        term("identity matrix Iₙ", "The diagonal n×n matrix with diagonal entries 1; it preserves every vector.", 4),
        term("invertible matrix", "A square matrix A having A⁻¹ with AA⁻¹=A⁻¹A=I.", 6),
        term("determinant", "A scalar invariant with det(AB)=det(A)det(B) that is nonzero exactly for invertible matrices.", 7),
        term("GLₙ(F)", "The group of invertible n×n matrices with entries in F.", 8),
        term("SLₙ(F)", "The subgroup of GLₙ(F) consisting of matrices with determinant 1.", 8)
      ],
      questions: [
        question("numeric", "Compute det([[3,2],[1,4]]).", "10", null, ["For [[a,b],[c,d]], det=ad−bc.", "Here det=3·4−2·1=12−2=10."], 7, 5350),
        question("single", "A is 2×3 and B is 3×4. What size is AB?", "2×4", ["2×3", "3×3", "2×4", "4×2"], ["The inner dimensions 3 match, so the product exists.", "The outer dimensions remain: 2 rows and 4 columns."], 3, 4550)
      ]
    },
    {
      id: "vector-spaces", chapterId: "linear-algebra", title: "Vector spaces, basis, and dimension",
      summary: "The structural setting in which representations act.",
      source: source("ch2", "9–14", 6028, "The second segment develops subspaces, span, independence, basis, and dimension."),
      objectives: ["Test span and independence", "Explain what a basis accomplishes", "Relate basis size to dimension"],
      intro: "Matrices depend on coordinates; vector spaces are the coordinate-free object underneath. A basis supplies coordinates, while invariant subspaces tell us when an action secretly breaks into smaller pieces.",
      sections: [
        { title: "Closure makes a vector space", body: "Vector addition and scalar multiplication obey eight familiar axioms. A nonempty subset is a subspace when the inherited operations never leave it." },
        { title: "Span versus independence", body: "Span asks whether the vectors generate everything you want. Independence asks whether any vector is redundant. A basis satisfies both conditions at once." },
        { title: "Dimension survives coordinates", body: "All bases of a finite-dimensional vector space have the same length. Choosing a basis turns vectors into coordinate columns and linear maps into matrices without changing the underlying dimension." }
      ],
      terms: [
        term("vector space", "A set with vector addition and scalar multiplication satisfying the vector-space axioms.", 9),
        term("subspace", "A nonempty subset that is itself a vector space under inherited operations.", 10),
        term("span(S)", "The set of every finite linear combination of vectors from S.", 12),
        term("linearly independent", "Only the trivial coefficients make a linear combination equal zero.", 13),
        term("basis", "A linearly independent set that spans the whole vector space.", 14),
        term("dimension", "The number of vectors in any basis of a finite-dimensional space.", 14)
      ],
      questions: [
        question("single", "Do (1,0) and (2,0) form a basis of ℝ²?", "No; they are dependent and do not span ℝ²", ["Yes; there are two vectors", "No; they are dependent and do not span ℝ²", "No; bases must have three vectors", "Yes; neither vector is zero"], ["(2,0)=2(1,0), so the set is linearly dependent.", "Every combination lies on the x-axis, so it also fails to span ℝ²."], 13, 6800),
        question("numeric", "What is dim(span{(1,0,0),(0,1,0)}) inside ℝ³?", "2", null, ["The two displayed vectors are linearly independent.", "They form a basis for their span, so its dimension is 2."], 14, 7000)
      ]
    },
    {
      id: "operators-spectral", chapterId: "linear-algebra", title: "Operators, eigenvalues, and the spectral theorem",
      summary: "Kernels, invariant directions, inner products, and simultaneous eigenvectors.",
      source: source("ch2", "15–25", 7347, "This segment supplies the linear-operator ideas later used for Hecke operators and representations."),
      objectives: ["Find kernels and eigenvalues in examples", "Recognize similarity invariants", "State the role of commuting self-adjoint operators"],
      intro: "Hecke forms are simultaneous eigenvectors of a whole family of operators. The spectral theorem explains why commuting self-adjoint operators can share a particularly nice basis.",
      sections: [
        { title: "Linear maps have two visible subspaces", body: "The kernel records inputs killed by T; the image records outputs attained by T. After choosing bases, T becomes a matrix, but kernel and image are intrinsic." },
        { title: "Eigenvectors preserve a direction", body: "An eigenvector v≠0 satisfies Tv=λv. Similar matrices describe the same operator in different bases, so determinant, trace, characteristic polynomial, and eigenvalues agree." },
        { title: "Geometry from an inner product", body: "Inner products define lengths and orthogonality. A commuting family of self-adjoint operators admits an orthonormal basis of simultaneous eigenvectors—the prototype for diagonalizing all Hecke operators together." }
      ],
      terms: [
        term("kernel", "The subspace of inputs v with T(v)=0.", 16),
        term("image", "The subspace of outputs T(v) attained by the transformation.", 16),
        term("eigenvector", "A nonzero v satisfying T(v)=λv for some scalar λ.", 18),
        term("trace", "The sum of a square matrix's diagonal entries.", 20),
        term("similar matrices", "Matrices related by B=P⁻¹AP, representing one map in different bases.", 21),
        term("orthonormal basis", "A basis of mutually orthogonal unit vectors.", 23),
        term("spectral theorem", "Commuting self-adjoint operators have an orthonormal basis of simultaneous eigenvectors.", 25)
      ],
      questions: [
        question("numeric", "What is the trace of diag(3, −1, 5)?", "7", null, ["The trace is the sum of diagonal entries.", "3+(−1)+5=7."], 20, 8400),
        question("multi", "Select every invariant shared by similar matrices.", ["determinant", "trace", "eigenvalues"], ["determinant", "trace", "individual entries", "eigenvalues", "chosen basis"], ["Similarity is a change of basis, not a change of operator.", "Determinant, trace, characteristic polynomial, and eigenvalues survive; entries and basis need not."], 21, 8600)
      ]
    },
    {
      id: "groups-actions", chapterId: "abstract-algebra", title: "Groups, homomorphisms, and actions",
      summary: "A language for symmetry, quotients, and structure-preserving maps.",
      source: source("ch3", "2–15", 9890, "The opening algebra segment runs from group axioms to orbits of group actions."),
      objectives: ["Recognize group structures", "Use kernels and quotient groups", "Interpret an orbit under a group action"],
      intro: "Galois theory studies symmetry, and groups are its grammar. A group packages reversible operations; homomorphisms compare groups; actions let a group move another set.",
      sections: [
        { title: "Symmetry as a group", body: "Associativity, an identity, and inverses make repeated reversible operations coherent. Abelian groups add commutativity; cyclic groups arise from powers of one generator." },
        { title: "Maps reveal quotients", body: "A homomorphism preserves multiplication. Its kernel measures what becomes invisible and is always normal, allowing the quotient G/ker φ to capture the effective part of the map." },
        { title: "Groups act", body: "An action G×X→X obeys e·x=x and (gh)·x=g·(h·x). The orbit of x is every location reachable from x under the group—exactly the viewpoint used when Galois automorphisms move roots or torsion points." }
      ],
      terms: [
        term("group", "A set with an associative operation, identity, and an inverse for every element.", 3),
        term("abelian group", "A group whose operation is also commutative.", 3),
        term("cyclic group", "A group generated by powers of a single element.", 5),
        term("homomorphism", "A map φ satisfying φ(ab)=φ(a)φ(b).", 11),
        term("kernel of a homomorphism", "The elements sent to the identity in the target group.", 12),
        term("group action", "A compatible rule for elements of G to move elements of a set X.", 13),
        term("orbit", "The set {g·x : g∈G} reachable from x under an action.", 14)
      ],
      questions: [
        question("single", "For φ:ℤ→ℤ/5ℤ given by reduction mod 5, what is ker φ?", "The multiples of 5", ["{0} only", "The multiples of 5", "The nonzero residues", "All odd integers"], ["The kernel contains integers mapping to the zero residue.", "An integer is 0 mod 5 exactly when 5 divides it."], 12, 11800),
        question("single", "Why must an isomorphism be bijective?", "So every target element corresponds to exactly one source element", ["So it can change the operation", "So every target element corresponds to exactly one source element", "So its kernel is the whole group", "So the groups have different sizes"], ["An isomorphism is meant to relabel the same structure.", "Bijectivity guarantees no source elements collapse and no target elements are missed."], 7, 10800)
      ]
    },
    {
      id: "rings-ufd", chapterId: "abstract-algebra", title: "Rings, ideals, and unique factorization",
      summary: "Generalize integer arithmetic far enough to factor in new number systems.",
      source: source("ch3", "16–27", 12967, "The slides develop rings and UFDs, then revisit the key n=3 factorization lemma."),
      objectives: ["Distinguish rings, domains, and fields", "Explain quotient rings", "Use the UFD property in a descent argument"],
      intro: "The n=3 proof factors an integer equation inside the Eisenstein integers. Rings tell us what arithmetic survives in that larger world; unique factorization tells us when a product being a cube forces its coprime factors to be cubes.",
      sections: [
        { title: "Rings retain addition and multiplication", body: "A ring has an abelian additive group and associative, distributive multiplication. An integral domain has no zero divisors; a field goes further by making every nonzero element invertible." },
        { title: "Ideals make quotients legal", body: "An ideal absorbs multiplication by ring elements. That absorption makes operations on cosets well-defined, producing R/I. Prime ideals behave like prime numbers at the level of quotients." },
        { title: "Factorization needs hypotheses", body: "In a UFD, nonzero nonunits factor uniquely into irreducibles up to order and units. The familiar integer argument about prime exponents then works in rings such as ℤ[ω]." }
      ],
      terms: [
        term("ring", "An abelian group under addition with associative, distributive multiplication.", 16),
        term("unit", "A ring element having a multiplicative inverse.", 18),
        term("integral domain", "A commutative ring with 1≠0 and no zero divisors.", 19),
        term("field", "A commutative ring in which every nonzero element is a unit.", 19),
        term("ideal", "An additive subgroup that absorbs multiplication by every ring element.", 21),
        term("irreducible", "A nonzero nonunit whose factorizations always contain a unit factor.", 25),
        term("UFD", "An integral domain with factorization into irreducibles unique up to order and units.", 26)
      ],
      questions: [
        question("multi", "Which are units in ℤ?", ["1", "−1"], ["1", "−1", "2", "0", "3"], ["A unit must have an inverse that is also an integer.", "Only 1 and −1 have integer multiplicative inverses."], 18, 13700),
        question("single", "Why is pairwise coprimality important when a product is a cube in a UFD?", "It prevents a prime exponent from being split across factors", ["It makes every factor a unit", "It prevents a prime exponent from being split across factors", "It removes associativity", "It makes the ring finite"], ["Unique factorization tracks each irreducible's exponent in the product.", "Coprimality puts each irreducible in at most one factor, so its exponent there must already be divisible by 3."], 26, 15100)
      ]
    },
    {
      id: "galois-theory", chapterId: "abstract-algebra", title: "Field extensions and Galois groups",
      summary: "Turn automorphisms of algebraic numbers into a group of arithmetic symmetries.",
      source: source("ch3", "28–33", 15413, "The lecture builds from extension degree to the absolute Galois group G_Q."),
      objectives: ["Interpret extension degree", "Define algebraic closure", "Explain what G_Q fixes and acts on"],
      intro: "Galois theory replaces questions about roots by questions about symmetries that preserve rational arithmetic. The absolute Galois group is enormous, but its finite-dimensional matrix shadows are tractable.",
      sections: [
        { title: "Extensions are vector spaces", body: "If F⊂E are fields, E is an F-vector space. Its dimension [E:F] measures how many independent directions were added; adjoining √2 to ℚ gives degree 2." },
        { title: "Algebraic closure contains every root", body: "An element is algebraic over F if it satisfies a nonzero polynomial over F. An algebraic closure F̄ is algebraic over F and algebraically closed, so every nonconstant polynomial splits there." },
        { title: "Automorphisms encode arithmetic symmetry", body: "Gal(E/F) consists of field automorphisms of E fixing F pointwise. Taking E=Q̄ produces G_Q=Gal(Q̄/Q), which acts on every algebraic construction defined over ℚ." }
      ],
      terms: [
        term("field extension E/F", "An inclusion F⊂E where both are fields.", 28),
        term("extension degree [E:F]", "The dimension of E as a vector space over F.", 28),
        term("algebraic element", "An element satisfying a nonzero polynomial with coefficients in the base field.", 29),
        term("algebraic closure", "An algebraic extension that is itself algebraically closed.", 30),
        term("Gal(E/F)", "The group of field automorphisms of E that fix F pointwise.", 32),
        term("G_Q", "The absolute Galois group Gal(Q̄/Q).", 33)
      ],
      questions: [
        question("numeric", "What is [ℚ(√2):ℚ]?", "2", null, ["Every element of ℚ(√2) has the form a+b√2.", "The basis {1,√2} has two elements, so the degree is 2."], 28, 15600),
        question("single", "An element σ∈G_Q must fix which numbers pointwise?", "Every rational number", ["Every complex number", "Every rational number", "Only 0 and 1", "Every algebraic number"], ["By definition G_Q=Gal(Q̄/Q).", "The notation after the slash is the base field fixed pointwise: Q."], 33, 16450)
      ]
    },
    {
      id: "galois-representations", chapterId: "abstract-algebra", title: "Galois representations and ramification",
      summary: "Project G_Q into matrices and record where arithmetic behavior becomes wild.",
      source: source("ch3", "34–43", 16652, "This segment introduces modules, representations, conductors, inertia, and Frobenius."),
      objectives: ["Read a rank-2 Galois representation", "Distinguish ramified from unramified", "Relate conductors and Frobenius elements"],
      intro: "A Galois representation translates a vast symmetry group into linear algebra. Ramification identifies primes where that translation is not well-behaved, and Frobenius supplies a canonical matrix at every unramified prime.",
      sections: [
        { title: "Representations linearize symmetry", body: "An R-module is like a vector space whose scalars may lie in a ring. A rank-2 representation ρ:G_Q→GL₂(R) assigns an invertible matrix to each Galois symmetry while preserving multiplication." },
        { title: "Inertia detects ramification", body: "At a prime p, the inertia subgroup I_p measures the part of local Galois symmetry invisible on the residue field. A representation is unramified at p precisely when every inertia element acts trivially." },
        { title: "Conductors and Frobenius summarize local data", body: "The Artin conductor is divisible exactly by ramified primes, with exponents measuring severity. At an unramified prime, Frobenius acts by x↦xᵖ on the residue field and has a meaningful matrix image." }
      ],
      terms: [
        term("R-module", "An abelian group with scalar multiplication by elements of a ring R.", 34),
        term("Galois representation", "A homomorphism ρ:G_Q→Aut_R(M), often written into GLₙ(R) after choosing a basis.", 36),
        term("irreducible representation", "A representation with no nonzero proper invariant subspace.", 38),
        term("inertia group I_p", "The subgroup of the decomposition group acting trivially on the residue field.", 40),
        term("unramified at p", "The inertia subgroup I_p acts trivially under the representation.", 41),
        term("Artin conductor", "An integer whose prime factors and exponents measure ramification of a representation.", 42),
        term("Frobenius", "At an unramified prime p, the residue-field automorphism represented by x↦xᵖ.", 43)
      ],
      questions: [
        question("single", "If ρ(I₇)={I}, what can you conclude?", "ρ is unramified at 7", ["ρ is reducible", "ρ is unramified at 7", "7 is not prime", "The conductor is 7"], ["I₇ is the inertia subgroup at 7.", "Trivial action of inertia is the definition of being unramified there."], 41, 17180),
        question("single", "For a rank-2 free R-module with a chosen basis, where do automorphisms live?", "GL₂(R)", ["SL₁(R)", "GL₂(R)", "R/2R", "The additive group of R"], ["A basis identifies the module with R².", "Invertible R-linear maps of R² are exactly invertible 2×2 matrices, GL₂(R)."], 36, 16750)
      ]
    },
    {
      id: "padic-numbers", chapterId: "abstract-algebra", title: "p-adic numbers and inverse limits",
      summary: "A metric where divisibility means closeness, built from compatible residues.",
      source: source("ch3", "44–49", 17648, "The final algebra segment constructs Z_p from compatible residue classes and Q_p as its fraction field/completion."),
      objectives: ["Compute p-adic valuations", "Interpret the p-adic metric", "Describe compatible sequences in Z_p"],
      intro: "The p-adic world zooms in on one prime at a time. Two rationals are close when their difference is divisible by a high power of p. This local viewpoint provides the coefficient rings for Tate modules.",
      sections: [
        { title: "Valuation counts a prime", body: "Write x=pⁿa/b with p dividing neither a nor b. Then v_p(x)=n and |x|_p=p⁻ⁿ. More p-divisibility therefore means smaller p-adic size." },
        { title: "A non-Archimedean geometry", body: "The strong triangle inequality |x+y|_p≤max(|x|_p,|y|_p) makes p-adic geometry unfamiliar: every point of a ball can serve as its center, and triangles are dominated by their longest side." },
        { title: "Compatible residues form Z_p", body: "A p-adic integer is a sequence (a₁,a₂,…) with aₙ mod pⁿ and aₙ₊₁ reducing to aₙ. The inverse limit stores all finite precisions simultaneously; Q_p is the fraction field of Z_p and the completion of Q." }
      ],
      terms: [
        term("p-adic valuation v_p(x)", "The exponent of p in the prime factorization of a nonzero rational x.", 44),
        term("p-adic absolute value", "|x|_p=p⁻ᵛᵖ⁽ˣ⁾.", 45),
        term("non-Archimedean inequality", "|x+y|_p≤max(|x|_p,|y|_p).", 45),
        term("inverse limit", "The object of sequences compatible under all transition maps in a projective system.", 46),
        term("Z_p", "The ring lim← Z/pⁿZ of compatible residues modulo every pⁿ.", 47),
        term("Q_p", "The completion of Q in the p-adic metric, equivalently the fraction field of Z_p.", 49)
      ],
      questions: [
        question("numeric", "Compute v₂(40/3).", "3", null, ["Factor 40/3=2³·5/3.", "Neither 5 nor 3 is divisible by 2, so the exponent is 3."], 44, 17880),
        question("single", "Which residue modulo 8 is compatible with 3 modulo 4?", "7 mod 8", ["0 mod 8", "2 mod 8", "6 mod 8", "7 mod 8"], ["Compatibility means reduction modulo 4 must give 3.", "7≡3 (mod 4), while the other options reduce to 0 or 2."], 46, 18350)
      ]
    },
    {
      id: "projective-curves", chapterId: "elliptic-curves", title: "Projective geometry and elliptic curves",
      summary: "Complete the plane, identify smooth cubics, and meet Weierstrass form.",
      source: source("ch4", "2–11", 18810, "This segment builds the projective definition of an elliptic curve and its distinguished point at infinity."),
      objectives: ["Read homogeneous coordinates", "Test smoothness conceptually", "State the definition of an elliptic curve"],
      intro: "The affine plane misses points where parallel directions meet. Projective geometry adds exactly those points and gives a complete home for cubic curves. A smooth cubic with a rational base point is an elliptic curve.",
      sections: [
        { title: "The projective plane closes the horizon", body: "A projective point (X:Y:Z) is unchanged when all coordinates are multiplied by a nonzero scalar. The affine chart Z≠0 becomes (X/Z,Y/Z); points with Z=0 form the line at infinity." },
        { title: "Smoothness excludes pinches and crossings", body: "A projective curve F=0 is singular at a point where all first partial derivatives vanish. Requiring smoothness removes nodes and cusps, letting geometric constructions behave uniformly." },
        { title: "Weierstrass form", body: "Over a field of characteristic not 2 or 3, an elliptic curve can be expressed as y²=x³+Ax+B with nonzero discriminant. Its projective closure contains O=(0:1:0), the future identity of the group law." }
      ],
      terms: [
        term("projective plane P²(k)", "Nonzero triples (X:Y:Z) over k, identified up to nonzero scaling.", 4),
        term("point at infinity", "A projective point with Z=0; on a Weierstrass cubic the distinguished one is O=(0:1:0).", 11),
        term("homogeneous polynomial", "A polynomial whose monomials all have the same total degree.", 5),
        term("singular point", "A point on a curve where all first partial derivatives vanish.", 6),
        term("elliptic curve over k", "A smooth projective cubic with at least one k-rational point.", 8),
        term("short Weierstrass equation", "y²=x³+Ax+B, available in characteristic other than 2 or 3.", 9)
      ],
      questions: [
        question("single", "Which projective point equals (2:4:6)?", "(1:2:3)", ["(1:2:3)", "(2:4:1)", "(4:2:6)", "(0:2:3)"], ["Projective coordinates are equal up to one common nonzero scale.", "Divide every coordinate of (2:4:6) by 2 to obtain (1:2:3)."], 4, 19060),
        question("multi", "Which conditions belong to the slide deck's definition of an elliptic curve?", ["It is a projective cubic", "It is smooth", "It has a k-rational point"], ["It is a projective cubic", "It is smooth", "It has a k-rational point", "It has no point at infinity", "Its coefficients are all positive"], ["An elliptic curve is a smooth projective cubic with a chosen/rational point over the base field.", "The point at infinity is not forbidden; in Weierstrass form it supplies the identity."], 8, 19550)
      ]
    },
    {
      id: "elliptic-group-law", chapterId: "elliptic-curves", title: "The group law",
      summary: "Add points geometrically and turn a curve into an abelian group.",
      source: source("ch4", "12–14", 19852, "These slides give the chord construction and state the resulting abelian group structure."),
      objectives: ["Trace the chord-and-tangent construction", "Identify identity and inverse points", "Explain why closure matters"],
      intro: "An elliptic curve is not just a shape. Its points can be added. The line through two points meets a cubic once more; reflecting that third intersection produces the sum in the usual Weierstrass picture.",
      sections: [
        { title: "Chord, third point, reflection", body: "For distinct P and Q, draw their line, find the third intersection R with the cubic, then reflect R across the x-axis. The result is P+Q. For doubling P, use the tangent at P." },
        { title: "Identity and inverse", body: "The point at infinity O is the additive identity. For y²=x³+Ax+B, the inverse of (x,y) is (x,−y), since their vertical line meets the curve at O." },
        { title: "A geometric abelian group", body: "The construction is closed, commutative, and associative—although associativity is the difficult axiom to prove. The arithmetic set E(k) therefore becomes an abelian group." }
      ],
      terms: [
        term("identity O", "The point at infinity satisfying P+O=P.", 11, 19852),
        term("inverse of P", "The point −P satisfying P+(−P)=O; in short Weierstrass form it reflects y.", 14),
        term("point doubling", "Computing P+P using the tangent line at P.", 12),
        term("chord construction", "Use the line through two points and the cubic's third intersection to define their sum.", 12),
        term("closure", "Adding two k-rational points yields another point in E(k).", 14),
        term("abelian group", "A group whose addition is commutative.", 14)
      ],
      questions: [
        question("single", "On y²=x³+Ax+B, what is the inverse of (x,y)?", "(x,−y)", ["(−x,y)", "(x,−y)", "(−x,−y)", "O in every case"], ["The two points lie on the same vertical line.", "That line's third projective intersection is O, so (x,y)+(x,−y)=O."], 14, 20100),
        question("single", "Which line is used to compute 2P?", "The tangent line at P", ["The x-axis", "Any vertical line", "The tangent line at P", "The line at infinity only"], ["The chord through P and Q approaches a limiting line as Q approaches P.", "That limiting line is the tangent, so it is used for point doubling."], 12, 19940)
      ]
    },
    {
      id: "reduction-frobenius", chapterId: "elliptic-curves", title: "Reduction, point counts, and Frobenius",
      summary: "Study a rational curve one prime at a time and extract a_p.",
      source: source("ch4", "15–19", 20324, "The lecture connects reduction type, finite-field point counts, Hasse's bound, and trace of Frobenius."),
      objectives: ["Classify basic reduction types", "Compute a_p from a point count", "Apply Hasse's bound"],
      intro: "Reducing an integral equation modulo p turns one rational curve into a finite combinatorial object. Counting its points produces a_p, a local number that later appears as both a Frobenius trace and a modular-form coefficient.",
      sections: [
        { title: "Good and bad reduction", body: "After reducing a minimal Weierstrass equation mod p, a smooth curve has good reduction. A node gives multiplicative reduction; a cusp gives additive reduction." },
        { title: "Point counts stay near p+1", body: "Hasse's theorem says |#E(F_q)−(q+1)|≤2√q. Thus the deviation a_p=p+1−#E(F_p) is tightly controlled." },
        { title: "A local arithmetic fingerprint", body: "At good primes, a_p is the trace of Frobenius. The full sequence of these local traces is strong enough to match an elliptic curve with a modular form." }
      ],
      terms: [
        term("good reduction", "The curve obtained after reduction modulo p is smooth.", 16),
        term("multiplicative reduction", "Bad reduction whose singularity is a node with distinct tangents.", 16),
        term("additive reduction", "Bad reduction whose singularity is a cusp with a repeated tangent.", 16),
        term("#E(F_q)", "The number of projective F_q-rational points on E, including O.", 17),
        term("Hasse bound", "|#E(F_q)−(q+1)|≤2√q.", 18),
        term("a_p(E)", "At good p, the deviation p+1−#E(F_p), also the trace of Frobenius.", 19)
      ],
      questions: [
        question("numeric", "A curve has good reduction at p=7 and #E(F₇)=10. Compute a₇.", "-2", null, ["Use a_p=p+1−#E(F_p).", "a₇=7+1−10=−2."], 19, 20700),
        question("single", "For q=9, Hasse's theorem allows #E(F₉) to differ from 10 by at most what amount?", "6", ["3", "6", "9", "18"], ["The bound is 2√q.", "For q=9, 2√9=2·3=6."], 18, 20580)
      ]
    },
    {
      id: "torsion-tate", chapterId: "elliptic-curves", title: "Torsion points and Tate modules",
      summary: "Bundle all ℓ-power division points into one rank-2 p-adic object.",
      source: source("ch4", "20–33", 20805, "This long segment passes from E[n] to Tate modules and both ℓ-adic and residual Galois representations."),
      objectives: ["Describe E[n]", "Explain compatibility in the Tate module", "Read the attached Galois representations"],
      intro: "Galois automorphisms permute the coordinates of torsion points while respecting addition. Recording that action at every ℓ-power level, compatibly, produces a single rank-2 module and a matrix representation.",
      sections: [
        { title: "Division points form a grid", body: "E[n] consists of points killed by multiplication by n. In characteristic 0 over an algebraic closure, E[n]≅(ℤ/nℤ)², so choosing a basis turns its automorphisms into GL₂(ℤ/nℤ)." },
        { title: "The inverse-limit tower", body: "The Tate module T_ℓ(E)=lim←E[ℓⁿ] contains compatible sequences Pₙ with [ℓ]Pₙ₊₁=Pₙ. It is a free rank-2 ℤ_ℓ-module." },
        { title: "Galois acts at every resolution", body: "Compatibility gives ρ_E,ℓ:G_Q→GL₂(ℤ_ℓ). Reducing its entries mod ℓ yields the residual representation ρ̄_E,ℓ:G_Q→GL₂(F_ℓ), equivalently the action on E[ℓ]." }
      ],
      terms: [
        term("E[n]", "The subgroup of n-division points P satisfying [n]P=O.", 20),
        term("n-torsion structure", "In characteristic 0, E[n]≅ℤ/nℤ×ℤ/nℤ over an algebraic closure.", 23),
        term("Tate module T_ℓ(E)", "The inverse limit of E[ℓⁿ] under multiplication-by-ℓ maps.", 28),
        term("compatible sequence", "Points Pₙ∈E[ℓⁿ] satisfying [ℓ]Pₙ₊₁=Pₙ.", 28),
        term("ℓ-adic representation", "ρ_E,ℓ:G_Q→GL₂(ℤ_ℓ), arising from Galois action on T_ℓ(E).", 31),
        term("residual representation", "The mod-ℓ representation ρ̄_E,ℓ:G_Q→GL₂(F_ℓ).", 32),
        term("Frobenius polynomial", "At good p≠ℓ, λ²−a_p(E)λ+p for ρ_E,ℓ(Frob_p).", 33)
      ],
      questions: [
        question("single", "Over an algebraic closure in characteristic 0, how many elements does E[n] have?", "n²", ["n", "2n", "n²", "infinitely many"], ["E[n]≅ℤ/nℤ×ℤ/nℤ.", "Each factor has n elements, so the product has n²."], 23, 21200),
        question("single", "What operation connects E[ℓⁿ⁺¹] to E[ℓⁿ] in the Tate-module tower?", "Multiplication by ℓ", ["Reduction modulo n", "Multiplication by ℓ", "Taking inverses", "Frobenius at ℓ"], ["An element is a sequence (Pₙ).", "Compatibility is [ℓ]Pₙ₊₁=Pₙ, so multiplication by ℓ is the transition map."], 27, 21700)
      ]
    },
    {
      id: "invariants-lfunctions", chapterId: "elliptic-curves", title: "Invariants, semistability, and L-functions",
      summary: "Compress local reduction data into global arithmetic signatures.",
      source: source("ch4", "34–47", 22701, "The last elliptic-curve segment develops minimal models, semistability, local factors, L-functions, and conductors."),
      objectives: ["Use discriminant valuations to read reduction", "Define semistability", "Assemble local L-factors and the conductor"],
      intro: "An elliptic curve has many equations, so arithmetic invariants must be read from minimal models. Reduction types then determine local Euler factors and conductor exponents, assembling prime-by-prime behavior into global objects.",
      sections: [
        { title: "Minimal equations make valuations meaningful", body: "At p, a minimal equation minimizes v_p(Δ) among integral models. For p≥5, v_p(Δ)=0 means good reduction; when v_p(Δ)>0, c₄ separates multiplicative from additive reduction." },
        { title: "Semistability excludes additive reduction", body: "A curve over ℚ is semistable if every prime has good or multiplicative reduction. Wiles first proved modularity for exactly this class, enough for the Frey curve." },
        { title: "From local counts to global series", body: "At a good prime, the local L-factor is (1−a_pp⁻ˢ+p¹⁻²ˢ)⁻¹. Multiplying local factors gives L(E,s). The conductor N_E=∏p^{f_p} records the locations and severity of bad reduction." }
      ],
      terms: [
        term("discriminant Δ", "A Weierstrass invariant that is nonzero exactly when the cubic is smooth.", 34),
        term("minimal model at p", "An integral Weierstrass equation minimizing v_p(Δ) in its isomorphism class.", 37),
        term("globally minimal model", "An integral equation minimal at every prime.", 38),
        term("semistable elliptic curve", "A curve with only good or multiplicative reduction at every prime.", 39),
        term("local L-factor", "A prime-by-prime Euler factor; at good p it is (1−a_pp⁻ˢ+p¹⁻²ˢ)⁻¹.", 45),
        term("Hasse–Weil L-function", "The product over all primes of the elliptic curve's local L-factors.", 46),
        term("conductor N_E", "The product ∏p^{f_p} encoding the curve's bad reduction.", 47)
      ],
      questions: [
        question("single", "A minimal model at p≥5 has v_p(Δ)>0 and v_p(c₄)=0. What is its reduction type?", "Multiplicative", ["Good", "Multiplicative", "Additive", "Impossible"], ["Positive discriminant valuation signals bad reduction.", "For a minimal model, c₄ remaining a unit (valuation 0) identifies multiplicative reduction."], 35, 22950),
        question("multi", "Which reduction types are allowed for a semistable elliptic curve?", ["good", "multiplicative"], ["good", "multiplicative", "additive", "singular over ℚ"], ["Semistability is defined prime by prime on a global minimal model.", "It permits good and multiplicative reduction, but excludes additive reduction."], 39, 23350)
      ]
    },
    {
      id: "modular-symmetry", chapterId: "modular-forms", title: "The modular group and modular forms",
      summary: "Functions on the upper half-plane constrained by Möbius symmetry.",
      source: source("ch5", "2–17", 23901, "This segment begins with eta and Δ, then develops SL₂(ℤ), congruence subgroups, cusps, and modularity."),
      objectives: ["Compute a fractional linear action", "State the modular transformation law", "Distinguish modular and cusp forms"],
      intro: "A modular form is a holomorphic function with so much symmetry that its Fourier coefficients become arithmetic. The modular group moves points of the upper half-plane by fractional linear transformations.",
      sections: [
        { title: "SL₂(ℤ) acts on ℍ", body: "A matrix γ=[[a,b],[c,d]] sends τ to (aτ+b)/(cτ+d). The generators S:τ↦−1/τ and T:τ↦τ+1 build the full modular group; a fundamental domain chooses one point from most orbits." },
        { title: "Weight controls transformation", body: "A weight-k modular form obeys f(γτ)=(cτ+d)^k f(τ), with suitable holomorphy on ℍ and at cusps. Congruence subgroups such as Γ₀(N) weaken the symmetry and introduce a level N." },
        { title: "Cusps and vanishing", body: "Holomorphy at a cusp is read from the q-expansion. A modular form has no negative q-powers; a cusp form has zero constant term and therefore vanishes at every cusp." }
      ],
      terms: [
        term("upper half-plane ℍ", "The set {τ∈ℂ : Im(τ)>0}.", 7),
        term("modular group", "SL₂(ℤ) acting on ℍ by τ↦(aτ+b)/(cτ+d).", 8),
        term("fundamental domain", "A region containing one representative from each generic group orbit.", 10),
        term("congruence subgroup Γ₀(N)", "Matrices in SL₂(ℤ) whose lower-left entry is divisible by N.", 12),
        term("weight-k modular form", "A holomorphic function on ℍ and at cusps satisfying the weight-k transformation law.", 14),
        term("cusp form", "A modular form whose q-expansion has zero constant term at every cusp.", 15),
        term("slash operator", "Notation packaging the weight-k transformed function f|_kγ.", 16)
      ],
      questions: [
        question("single", "What does T do to τ?", "τ+1", ["−1/τ", "τ+1", "2τ", "τ/(τ+1)"], ["The standard generators are S and T.", "By definition T(τ)=τ+1; S(τ)=−1/τ."], 9, 24650),
        question("single", "What q-expansion feature distinguishes a cusp form?", "Its constant term is zero", ["Every coefficient is zero", "Its constant term is zero", "It has negative powers only", "Its coefficients are all prime"], ["Holomorphy at the cusp rules out negative powers.", "Vanishing at the cusp additionally sets the q⁰ coefficient to zero."], 15, 25200)
      ]
    },
    {
      id: "spaces-petersson", chapterId: "modular-forms", title: "Spaces of forms and the Petersson product",
      summary: "Finite-dimensional function spaces with an orthogonal geometry.",
      source: source("ch5", "18–22", 25656, "This segment treats dimensions, Eisenstein/cusp decomposition, and the Petersson inner product."),
      objectives: ["Interpret M_k and S_k as vector spaces", "Explain Eisenstein plus cusp decomposition", "Use orthogonality conceptually"],
      intro: "Fixing weight and level turns an infinite analytic universe into a finite-dimensional vector space. The Petersson inner product adds geometry, making it possible to speak of orthogonal complements and newforms.",
      sections: [
        { title: "Finite-dimensionality is powerful", body: "M_k(Γ) and its cusp subspace S_k(Γ) are finite-dimensional. A modular form can therefore be described by finitely many coordinates once a basis is chosen." },
        { title: "Eisenstein and cusp pieces", body: "For the full modular group in suitable even weights, a modular form splits uniquely into an Eisenstein series plus a cusp form. One part is controlled by boundary behavior; the other vanishes there." },
        { title: "Petersson geometry", body: "Integrating f(τ)overline{g(τ)}(Im τ)^k over a fundamental domain defines the Petersson inner product on cusp forms. It yields norms, angles, and orthogonal decompositions." }
      ],
      terms: [
        term("M_k(Γ)", "The finite-dimensional vector space of weight-k modular forms for Γ.", 18),
        term("S_k(Γ)", "The subspace of weight-k cusp forms for Γ.", 18),
        term("dimension formula", "A formula computing the finite dimension of a modular- or cusp-form space.", 19),
        term("Eisenstein subspace", "The complementary part generated by Eisenstein series in the modular-form space.", 20),
        term("Petersson inner product", "An integral inner product on cusp forms over a fundamental domain.", 21),
        term("orthogonal complement", "Vectors having inner product zero with every vector in a given subspace.", 22)
      ],
      questions: [
        question("single", "Why can the spectral theorem become relevant to modular forms?", "Hecke operators act on finite-dimensional inner-product spaces", ["All modular forms are matrices", "Hecke operators act on finite-dimensional inner-product spaces", "Every modular form is constant", "Integration makes the space infinite-dimensional"], ["S_k(Γ) is finite-dimensional and carries the Petersson inner product.", "Commuting self-adjoint Hecke operators can therefore be simultaneously diagonalized."], 22, 26000),
        question("single", "If f lies in the orthogonal complement of W, what holds for every w∈W?", "⟨f,w⟩=0", ["f=w", "⟨f,w⟩=0", "f(w)=1", "dim W=0"], ["Orthogonality is defined by a zero inner product.", "The orthogonal complement consists precisely of vectors orthogonal to every member of W."], 22, 26000)
      ]
    },
    {
      id: "hecke-forms", chapterId: "modular-forms", title: "Hecke operators and eigenforms",
      summary: "Commuting operators expose multiplicative Fourier coefficients.",
      source: source("ch5", "23–31", 26099, "The lecture moves from multiplicative functions to Hecke operators and their simultaneous eigenforms."),
      objectives: ["Recognize multiplicative coefficient relations", "Define a Hecke eigenform", "Connect simultaneous diagonalization to a Hecke basis"],
      intro: "Hecke operators act on modular forms while remembering arithmetic at each positive integer. Their simultaneous eigenvectors have Fourier coefficients that multiply in precisely the way needed for Euler products.",
      sections: [
        { title: "Multiplicativity is arithmetic structure", body: "A function a(n) is multiplicative when a(mn)=a(m)a(n) for coprime m,n. Normalized Hecke eigenforms have coefficient sequences with this property and additional prime-power recurrences." },
        { title: "A commuting family", body: "The Hecke operators T_n commute and are compatible with the Petersson product. The spectral theorem therefore supplies a basis of simultaneous eigenvectors." },
        { title: "Normalize the first coefficient", body: "A Hecke eigenform is scaled so a(1)=1. Then its T_n-eigenvalue is a(n), making the analytic q-expansion and operator arithmetic two views of the same data." }
      ],
      terms: [
        term("multiplicative function", "A function a with a(1)=1 and a(mn)=a(m)a(n) when gcd(m,n)=1.", 24),
        term("Hecke operator T_n", "A linear operator on modular forms encoding degree-n arithmetic correspondences.", 25),
        term("commuting operators", "Operators satisfying T_mT_n=T_nT_m.", 27),
        term("Hecke eigenform", "A nonzero modular form that is an eigenvector for every T_n.", 28),
        term("normalized eigenform", "A Hecke eigenform scaled so its first Fourier coefficient a(1)=1.", 29),
        term("Ramanujan τ-function", "The Fourier coefficients of the modular discriminant Δ(τ).", 23),
        term("simultaneous eigenbasis", "A basis whose vectors are eigenvectors for every operator in a family.", 31)
      ],
      questions: [
        question("numeric", "For a normalized eigenform, a(2)=−2 and a(3)=−1. Using coprime multiplicativity, compute a(6).", "2", null, ["Since gcd(2,3)=1, a(6)=a(2)a(3).", "Multiply (−2)(−1)=2."], 29, 27350),
        question("single", "Why is one eigenvector for every T_n especially useful?", "Its q-coefficients encode all the corresponding eigenvalues", ["It makes the form constant", "Its q-coefficients encode all the corresponding eigenvalues", "It removes the level", "It forces weight zero"], ["For a normalized Hecke eigenform, T_nf=a(n)f.", "The one coefficient sequence a(n) therefore records the whole family of eigenvalues."], 28, 27200)
      ]
    },
    {
      id: "newforms-representations", chapterId: "modular-forms", title: "L-functions, newforms, and Galois representations",
      summary: "Extract Euler products and matrix-valued arithmetic from eigenforms.",
      source: source("ch5", "32–38", 28107, "The final modular-forms segment introduces L-functions, old/new decomposition, and attached Galois representations."),
      objectives: ["Build an L-function from coefficients", "Distinguish oldforms and newforms", "State the Frobenius trace relation"],
      intro: "A normalized Hecke eigenform simultaneously produces a Dirichlet series, an Euler product, and a Galois representation. Newforms isolate the genuinely level-N part of the theory.",
      sections: [
        { title: "Coefficients become an L-function", body: "For f=Σa(n)qⁿ, define L(f,s)=Σa(n)n⁻ˢ. Hecke multiplicativity reorganizes this sum into an Euler product, one local factor per prime." },
        { title: "Old versus new", body: "Oldforms at level N are lifted from proper divisors M|N. The new subspace is their Petersson orthogonal complement; its normalized Hecke eigenforms are the newforms." },
        { title: "Deligne's representation", body: "A normalized newform gives a p-adic Galois representation. At suitable primes ℓ, Frobenius has trace a(ℓ) and determinant ℓ^{k−1}, translating Fourier data into matrices." }
      ],
      terms: [
        term("L(f,s)", "The Dirichlet series Σa(n)n⁻ˢ attached to a modular form f=Σa(n)qⁿ.", 32),
        term("Euler product", "A factorization of an L-function into one local factor for each prime.", 33),
        term("oldform", "A level-N cusp form constructed from a form at a proper lower level.", 36),
        term("new subspace", "The Petersson orthogonal complement of the old subspace.", 36),
        term("newform", "A normalized simultaneous Hecke eigenform in the new subspace.", 36),
        term("ρ_f,p", "The p-adic Galois representation attached to a normalized Hecke eigenform.", 37),
        term("Frobenius trace relation", "At suitable ℓ, tr ρ_f,p(Frob_ℓ)=a(ℓ).", 37)
      ],
      questions: [
        question("single", "A cusp form at level N comes by substitution f(dz) from a proper lower level. What is it?", "An oldform", ["An Eisenstein series only", "An oldform", "A Frey curve", "A residual representation"], ["Lower-level forms can be lifted when their level divides N.", "Their span is the old subspace, so such a lift is an oldform."], 35, 28600),
        question("single", "At an unramified prime ℓ for ρ_f,p, which modular-form datum appears as the Frobenius trace?", "a(ℓ)", ["The weight k", "The level N", "a(ℓ)", "The constant term only"], ["The attached representation is designed to match Hecke data.", "Its Frobenius characteristic polynomial has trace a(ℓ)."], 37, 28700)
      ]
    },
    {
      id: "four-clues", chapterId: "endgame", title: "Four clues linking the two worlds",
      summary: "L-functions, periods, j-invariants, and matching local coefficients.",
      source: source("ch6", "2–12", 28982, "The chapter begins by comparing four independent-looking signatures of elliptic curves and modular forms."),
      objectives: ["List the four comparison clues", "Match a_p(E) with a(p)", "Explain why weight 2 is singled out"],
      intro: "By the end of the previous chapters, elliptic curves and modular forms carry eerily parallel data. The repeated matches suggest one object should arise from the other, not merely resemble it.",
      sections: [
        { title: "Global analytic data match", body: "Both sides have Euler-product L-functions. Equality L(E,s)=L(f,s) means equality of local factors at almost every prime and therefore a_p(E)=a(p)." },
        { title: "Periods turn forms into tori", body: "Integrating a weight-2 newform produces a rank-2 lattice Λ in ℂ. The quotient ℂ/Λ is a complex torus, and the Weierstrass ℘-function realizes that torus as an elliptic curve." },
        { title: "Geometry and bounds align", body: "The elliptic j-invariant matches the modular j-function under uniformization. Hasse's bound |a_p(E)|≤2√p is exactly the weight-2 Ramanujan–Petersson bound on a(p)." }
      ],
      terms: [
        term("matching L-functions", "The equality L(E,s)=L(f,s), forcing matching local Euler factors.", 2),
        term("period lattice", "The rank-2 lattice obtained by integrating a weight-2 newform along cycles.", 3),
        term("complex torus", "A quotient ℂ/Λ for a rank-2 lattice Λ.", 4),
        term("j-invariant", "An isomorphism invariant matching elliptic curves over ℂ with modular orbits.", 7),
        term("coefficient match", "The identity a_p(E)=a(p) at good primes.", 9),
        term("weight 2", "The weight whose Ramanujan bound |a(p)|≤2√p matches Hasse's bound.", 10)
      ],
      questions: [
        question("numeric", "At p=5, a curve has #E(F₅)=8. What modular coefficient a(5) should a matching newform have?", "-2", null, ["Compute a₅(E)=5+1−8=−2.", "Modularity matches a₅(E) with the newform coefficient a(5)."], 9, 29600),
        question("single", "Why does weight 2 fit elliptic curves in the bound comparison?", "Its coefficient bound is 2√p, the same as Hasse's bound", ["It has no Fourier series", "Its coefficient bound is 2√p, the same as Hasse's bound", "All elliptic curves have degree 2", "It removes Frobenius"], ["For weight k, the bound is |a(p)|≤2p^(k−1)/2.", "At k=2 this becomes 2√p, exactly the Hasse scale."], 10, 29780)
      ]
    },
    {
      id: "modularity-theorem", chapterId: "endgame", title: "Three faces of modularity",
      summary: "See one theorem through L-functions, parametrizations, and representations.",
      source: source("ch6", "13–18", 30160, "The slides state the modularity theorem and align its analytic, geometric, and Galois-representation forms."),
      objectives: ["State the modularity theorem", "Relate its three formulations", "Distinguish p-adic and residual representations"],
      intro: "The modularity theorem says every elliptic curve over ℚ comes from a weight-2 newform of the same conductor. Equality can be detected analytically, geometrically, or through Galois representations.",
      sections: [
        { title: "Analytic face", body: "For E/ℚ of conductor N, there is a normalized f∈S₂(Γ₀(N)) with L(E,s)=L(f,s). Matching Euler factors gives the same a_p at good primes." },
        { title: "Geometric face", body: "There is a nonconstant rational map X₀(N)→E—a modular parametrization. The curve is a quotient of a Jacobian built from modular forms." },
        { title: "Algebraic face", body: "For each prime p, the associated p-adic Galois representations are isomorphic. Reducing modulo p gives residual representations, the objects used by Serre's and Ribet's theorems." }
      ],
      terms: [
        term("modularity theorem", "Every elliptic curve E/ℚ of conductor N corresponds to a weight-2 newform of level N.", 13),
        term("analytic formulation", "L(E,s)=L(f,s).", 16),
        term("geometric formulation", "A nonconstant rational map X₀(N)→E exists.", 16),
        term("algebraic formulation", "The compatible Galois representations attached to E and f are isomorphic.", 16),
        term("modular parametrization", "A nonconstant map from the modular curve X₀(N) to E.", 16),
        term("residual representation", "A p-adic representation reduced modulo p to coefficients in F_p.", 18)
      ],
      questions: [
        question("single", "If E has conductor 37, modularity supplies a weight-2 newform at what level?", "37", ["1", "2", "37", "74"], ["The theorem matches the level of the newform to the conductor of E.", "Thus conductor N_E=37 gives level N=37."], 13, 30220),
        question("multi", "Select all three formulations presented for modularity.", ["equality of L-functions", "a modular parametrization", "isomorphic Galois representations"], ["equality of L-functions", "a modular parametrization", "isomorphic Galois representations", "equal Weierstrass equations", "identical complex coordinates"], ["The analytic, geometric, and algebraic faces use L-functions, a map X₀(N)→E, and Galois representations.", "They express the same correspondence in different languages."], 16, 30400)
      ]
    },
    {
      id: "serre-ribet", chapterId: "endgame", title: "Serre's recipe and Ribet's level lowering",
      summary: "Use a residual representation to force a modular form to an impossibly low level.",
      source: source("ch6", "19–22", 30670, "This segment states Serre's modularity idea and the level-lowering theorem used in the FLT argument."),
      objectives: ["State the shape of Serre's conjecture", "Explain level lowering conceptually", "Identify the role of irreducibility"],
      intro: "Residual representations are the bridge in the contradiction. Serre predicts when one must come from a modular form and at what weight and level; Ribet shows that under precise local hypotheses its level can be lowered.",
      sections: [
        { title: "Serre reverses the arrow", body: "Modular forms produce representations. Serre conjectured the converse: every continuous, odd, irreducible ρ̄:G_Q→GL₂(F_p) is modular, with weight and level predicted from local behavior." },
        { title: "The conductor predicts level", body: "Away from p, the Artin conductor measures ramification and predicts the minimal modular level. This makes detailed local analysis globally decisive." },
        { title: "Ribet lowers the level", body: "Starting from a modular residual representation satisfying finiteness and irreducibility conditions, Ribet's theorem removes certain primes from the level. For the Frey representation, all odd primes disappear, leaving level 2." }
      ],
      terms: [
        term("odd representation", "A two-dimensional representation where complex conjugation has determinant −1.", 20),
        term("Serre's conjecture", "Continuous odd irreducible mod-p representations of G_Q arise from modular forms.", 20),
        term("Serre level", "The prime-to-p Artin conductor predicted as the modular form's minimal level.", 21),
        term("Serre weight", "The modular weight predicted from local behavior at p.", 21),
        term("level lowering", "A theorem producing a congruent modular form at a smaller level under local hypotheses.", 22),
        term("irreducibility", "The absence of a nonzero proper invariant line in the two-dimensional representation.", 22)
      ],
      questions: [
        question("single", "What local invariant predicts the level in Serre's recipe away from p?", "The Artin conductor", ["The j-invariant", "The Artin conductor", "The complex period", "The matrix trace at identity"], ["Ramification is summarized by the Artin conductor.", "Serre's strong recipe uses that conductor away from p as the predicted level."], 21, 30780),
        question("single", "Why is irreducibility listed before applying Ribet's theorem here?", "It is one of the theorem's hypotheses", ["It makes the curve singular", "It is one of the theorem's hypotheses", "It forces p=2", "It eliminates all matrices"], ["Level lowering is not automatic for every representation.", "Continuity, oddness, irreducibility, modularity, and local conditions are among the required hypotheses."], 22, 30920)
      ]
    },
    {
      id: "frey-curve", chapterId: "endgame", title: "The Frey curve",
      summary: "Turn a hypothetical Fermat solution into a semistable elliptic curve.",
      source: source("ch6", "23–30", 30670, "The slides construct the Frey curve, analyze minimal models and reduction, and compute residual conductor 2."),
      objectives: ["Construct the Frey curve", "Explain its semistability", "Follow why the residual conductor becomes 2"],
      intro: "Suppose aᵖ+bᵖ+cᵖ=0 for a prime p≥5. Frey's insight is to encode that solution in an elliptic curve whose discriminant and reduction are so unusual that modularity and level lowering collide.",
      sections: [
        { title: "Build geometry from the equation", body: "Attach E:y²=x(x−aᵖ)(x+bᵖ). Its roots and discriminant are controlled by aᵖ, bᵖ, and cᵖ. After normalizing a primitive solution, one obtains a global minimal model." },
        { title: "Why semistable", body: "At primes not dividing 2abc the curve has good reduction. At primes dividing abc, the minimal-model valuations give multiplicative rather than additive reduction. The prime 2 is handled by a special change of variables." },
        { title: "Residual ramification collapses", body: "For ρ̄_E,p, local analysis makes the representation unramified at odd primes dividing abc; other good primes contribute nothing. The residual conductor is therefore 2." }
      ],
      terms: [
        term("Frey curve", "E:y²=x(x−aᵖ)(x+bᵖ) attached to a primitive Fermat solution.", 23),
        term("primitive FLT solution", "A nonzero solution aᵖ+bᵖ+cᵖ=0 with gcd(a,b,c)=1.", 23),
        term("local minimal model", "A Weierstrass model minimizing the discriminant valuation at a chosen prime.", 24),
        term("semistability of E", "The Frey curve has only good or multiplicative reduction.", 25),
        term("residual Frey representation", "ρ̄_E,p:G_Q→GL₂(F_p), the Galois action on E[p].", 26),
        term("conductor 2", "The result N(ρ̄_E,p)=2 after the prime-by-prime ramification analysis.", 30)
      ],
      questions: [
        question("single", "At an odd prime ℓ dividing abc, what reduction does the Frey curve have?", "Multiplicative reduction", ["Good reduction", "Multiplicative reduction", "Additive reduction", "No reduction"], ["The Frey discriminant is divisible by such ℓ, so reduction is bad.", "The c₄ behavior for the minimal model makes the bad reduction multiplicative, supporting semistability."], 25, 31150),
        question("single", "What is the crucial conductor computed for the residual Frey representation?", "2", ["1", "2", "p", "abc"], ["Prime-by-prime analysis removes good primes and odd divisors of abc from residual ramification.", "The remaining Artin conductor is N(ρ̄_E,p)=2."], 30, 31500)
      ]
    },
    {
      id: "final-contradiction", chapterId: "endgame", title: "The final contradiction",
      summary: "Assemble the implication chain and locate exactly where impossibility enters.",
      source: source("ch6", "31–33", 31716, "The final slides combine Wiles' semistable modularity, Ribet's theorem, and dim S₂(Γ₀(2))=0."),
      objectives: ["Reconstruct the full implication chain", "Explain why level 2 is impossible", "State exactly what Wiles proved that FLT needs"],
      intro: "No single calculation proves FLT here. The conclusion comes from an implication chain: a solution creates a Frey curve; Wiles makes it modular; Ribet lowers its residual level to 2; but there is no weight-2 cusp form at level 2.",
      sections: [
        { title: "Assume a prime-exponent solution", body: "It is enough to rule out n=4 and odd prime exponents. The classical descent handles n=4; for p≥5, a primitive solution yields the semistable Frey curve." },
        { title: "Existence is forced twice", body: "Wiles' semistable modularity attaches a weight-2 newform to E. Its residual representation is irreducible and modular. Ribet's theorem then forces the same residual system to arise at level 2." },
        { title: "But the target space is zero", body: "The dimension formula gives dim S₂(Γ₀(2))=0. A nonzero normalized eigenform at level 2 cannot exist. Therefore the original Fermat solution cannot exist." },
        { title: "Scope of the roadmap", body: "The supplied lecture explains why the modularity and level-lowering results imply FLT; it does not prove those major theorems internally. Understanding this logical architecture is the course's finish line." }
      ],
      terms: [
        term("Wiles' theorem used here", "Every semistable elliptic curve over ℚ is modular.", 32),
        term("Ribet's contribution", "Level lowering turns the modular residual Frey representation into one of level 2.", 32),
        term("level-2 obstruction", "S₂(Γ₀(2)) has dimension zero, so the required newform cannot exist.", 33),
        term("contradiction", "The hypothetical solution forces existence of an object in an empty vector space.", 32),
        term("prime-exponent reduction", "After n=4, it suffices to rule out solutions for odd prime exponents.", 32),
        term("FLT", "For every integer n>2, xⁿ+yⁿ=zⁿ has no solution in positive integers.", 32)
      ],
      questions: [
        question("single", "Which fact provides the final impossibility?", "dim S₂(Γ₀(2))=0", ["The Frey curve has no points", "dim S₂(Γ₀(2))=0", "Every group is abelian", "All p-adic numbers vanish"], ["Wiles plus Ribet force a nonzero weight-2 level-2 newform.", "The dimension formula says that entire cusp-form space is {0}, so no such normalized form exists."], 33, 31920),
        question("single", "What part of modularity did Wiles need for this FLT route?", "Modularity of semistable elliptic curves over ℚ", ["Modularity of every variety", "Only modularity of the Frey equation over F₂", "Modularity of semistable elliptic curves over ℚ", "A proof of Ribet's theorem"], ["The Frey curve is proved semistable.", "Therefore Wiles' semistable case is sufficient; full modularity was completed later."], 32, 31820),
        question("multi", "Select the implication chain in the correct ingredients (order is explained in the solution).", ["Frey curve", "Wiles modularity", "Ribet level lowering", "no level-2 cusp form"], ["Frey curve", "Wiles modularity", "Ribet level lowering", "no level-2 cusp form", "Pythagorean theorem alone"], ["A hypothetical solution produces the semistable Frey curve.", "Wiles makes it modular; Ribet lowers the residual level to 2; dim S₂(Γ₀(2))=0 contradicts the required form."], 32, 31716)
      ]
    }
  ];

  function buildHelp(unit, page, time) {
    const file = slideFiles[unit.source.file];
    const pageLabel = String(page || unit.source.pages);
    const seconds = Number(time == null ? unit.source.time : time);
    return {
      slideTitle: file.title,
      slidePages: pageLabel,
      slideUrl: "https://drive.google.com/file/d/" + file.id + "/view#page=" + String(pageLabel).split("–")[0],
      videoTime: seconds,
      videoUrl: "https://www.youtube.com/watch?v=" + VIDEO_ID + "&t=" + seconds + "s",
      note: unit.source.note
    };
  }

  function termQuestions(unit) {
    const result = [];
    unit.terms.forEach(function (item, index) {
      const other = [1, 2, 3].map(function (step) {
        return unit.terms[(index + step) % unit.terms.length];
      });
      const help = buildHelp(unit, item.page, item.time);
      result.push({
        id: unit.id + "-term-" + index,
        type: "single",
        prompt: "Which description best matches <strong>" + item.name + "</strong>?",
        answer: item.definition,
        choices: [item.definition].concat(other.map(function (entry) { return entry.definition; })),
        solution: ["Locate the defining property, not just a nearby topic.", "<strong>" + item.name + "</strong>: " + item.definition],
        help: help
      });
      result.push({
        id: unit.id + "-reverse-" + index,
        type: "single",
        prompt: "Which term fits this definition?<br><em>" + item.definition + "</em>",
        answer: item.name,
        choices: [item.name].concat(other.map(function (entry) { return entry.name; })),
        solution: ["Match each phrase to the property it defines.", "The definition names <strong>" + item.name + "</strong>."],
        help: help
      });
    });
    return result;
  }

  units.forEach(function (unit) {
    const custom = unit.questions.map(function (item, index) {
      return Object.assign({}, item, {
        id: unit.id + "-applied-" + index,
        help: buildHelp(unit, item.page, item.time)
      });
    });
    unit.questionBank = termQuestions(unit).concat(custom);
    delete unit.questions;
  });

  chapters.forEach(function (chapter) {
    chapter.units = units.filter(function (unit) { return unit.chapterId === chapter.id; });
  });

  window.FLT_COURSE = {
    version: 1,
    title: "The road to Fermat's Last Theorem",
    videoId: VIDEO_ID,
    slidesFolder: SLIDES_FOLDER,
    slideFiles: slideFiles,
    chapters: chapters,
    units: units
  };
})();
