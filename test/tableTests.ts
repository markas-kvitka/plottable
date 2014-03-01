///<reference path="testReference.ts" />

var assert = chai.assert;

function generateBasicTable(nRows, nCols) {
  // makes a table with exactly nRows * nCols children in a regular grid, with each
  // child being a basic component
  var table = new Table();
  var rows: Component[][] = [];
  var components: Component[] = [];
  for(var i=0; i<nRows; i++) {
    for(var j=0; j<nCols; j++) {
      var r = new Component().rowWeight(1).colWeight(1);
      table.addComponent(i, j, r);
      components.push(r);
    }
  }
  return {"table": table, "components": components};
}

describe("Tables", () => {
  it("tables are classed properly", () => {
    var table = new Table();
    assert.isTrue(table.classed("table"));
  });

  it("padTableToSize works properly", () => {
    var t = new Table();
    assert.deepEqual((<any> t).rows, [], "the table rows is an empty list");
    (<any> t).padTableToSize(1,1);
    var rows = (<any> t).rows;
    var row = rows[0];
    var firstComponent = row[0];
    assert.lengthOf(rows, 1, "there is one row");
    assert.lengthOf(row, 1, "the row has one element");
    assert.isTrue(firstComponent.constructor.name === "Component", "the row only has a null component");

    (<any> t).padTableToSize(5,2);
    assert.lengthOf(rows, 5, "there are five rows");
    rows.forEach((r) => assert.lengthOf(r, 2, "there are two columsn per row"));
    assert.equal(rows[0][0], firstComponent, "the first component is unchanged");
  });

  it("table constructor can take a list of lists of components", () => {
    var c0 = new Component();
    var row1 = [null, c0];
    var row2 = [new Component(), null];
    var table = new Table([row1, row2]);
    assert.isTrue((<any> table).rows[0][0].constructor.name === "Component", "the first element was turned into a null component");
    assert.equal((<any> table).rows[0][1], c0, "the component is in the right spot");
    var c1 = new Component();
    table.addComponent(2, 2, c1);
    assert.equal((<any> table).rows[2][2], c1, "the inserted component went to the right spot");
  });

  it("base components are overwritten by the addComponent constructor, and other components are not", () => {
    var c0 = new Component();
    var c1 = new Table();
    var c2 = new Table();
    var t = new Table();
    t.addComponent(0, 0, c0);
    t.addComponent(0, 2, c1);
    t.addComponent(0, 0, c2);
    assert.equal((<any> t).rows[0][0], c2, "the baseComponent was overwritten by the table");
    assert.throws(() => t.addComponent(0, 2, c2), Error, "component already exists");
  });

  it("tables can be constructed by adding components in matrix style", () => {
    var table = new Table();
    var c1 = new Component();
    var c2 = new Component();
    table.addComponent(0, 0, c1);
    table.addComponent(1, 1, c2);
    var rows = (<any> table).rows;
    assert.lengthOf(rows, 2, "there are two rows");
    assert.lengthOf(rows[0], 2, "two cols in first row");
    assert.lengthOf(rows[1], 2, "two cols in second row");
    assert.equal(rows[0][0], c1, "first component added correctly");
    assert.equal(rows[1][1], c2, "second component added correctly");
    assert.isTrue(rows[0][1].constructor.name === "Component", "added a null component to 0,1");
    assert.isTrue(rows[1][0].constructor.name === "Component", "added a null component to 1,0");
  })

  it("tables with insufficient space throw Insufficient Space", () => {
    var svg = generateSVG(200, 200);
    var c = new Component().rowMinimum(300).colMinimum(300);
    var t = new Table().addComponent(0, 0, c);
    t.anchor(svg);
    assert.throws(() => t.computeLayout(), Error, "Insufficient Space");
    svg.remove();
  });

  it("basic table with 2 rows 2 cols lays out properly", () => {
    var tableAndcomponents = generateBasicTable(2,2);
    var table = tableAndcomponents.table;
    var components = tableAndcomponents.components;

    var svg = generateSVG();
    table.anchor(svg).computeLayout().render();

    var elements = components.map((r) => r.element);
    var translates = elements.map((e) => getTranslate(e));
    assert.deepEqual(translates[0], [0, 0], "first element is centered at origin");
    assert.deepEqual(translates[1], [200, 0], "second element is located properly");
    assert.deepEqual(translates[2], [0, 200], "third element is located properly");
    assert.deepEqual(translates[3], [200, 200], "fourth element is located properly");
    var bboxes = elements.map((e) => Utils.getBBox(e));
    bboxes.forEach((b) => {
      assert.equal(b.width, 200, "bbox is 200 pixels wide");
      assert.equal(b.height, 200, "bbox is 200 pixels tall");
      });
    svg.remove();
  });

  it("table with 2 rows 2 cols and margin/padding lays out properly", () => {
    var tableAndcomponents = generateBasicTable(2,2);
    var table = tableAndcomponents.table;
    var components = tableAndcomponents.components;

    table.padding(5,5);

    var svg = generateSVG(415, 415);
    table.anchor(svg).computeLayout().render();

    var elements = components.map((r) => r.element);
    var translates = elements.map((e) => getTranslate(e));
    var bboxes = elements.map((e) => Utils.getBBox(e));
    assert.deepEqual(translates[0], [0, 0], "first element is centered properly");
    assert.deepEqual(translates[1], [210, 0], "second element is located properly");
    assert.deepEqual(translates[2], [0, 210], "third element is located properly");
    assert.deepEqual(translates[3], [210, 210], "fourth element is located properly");
    bboxes.forEach((b) => {
      assert.equal(b.width, 205, "bbox is 205 pixels wide");
      assert.equal(b.height, 205, "bbox is 205 pixels tall");
      });
    svg.remove();
  });

  it("table with fixed-size objects on every side lays out properly", () => {
    var svg = generateSVG();
    var tableAndcomponents = generateBasicTable(3,3);
    var table = tableAndcomponents.table;
    var components = tableAndcomponents.components;
    // [0 1 2] \\
    // [3 4 5] \\
    // [6 7 8] \\
    // First, set everything to have no weight
    components.forEach((r) => r.colWeight(0).rowWeight(0).colMinimum(0).rowMinimum(0));
    // give the axis-like objects a minimum
    components[1].rowMinimum(30);
    components[7].rowMinimum(30);
    components[3].colMinimum(50);
    components[5].colMinimum(50);
    // finally the center 'plot' object has a weight
    components[4].rowWeight(1).colWeight(1);

    table.anchor(svg).computeLayout().render();

    var elements = components.map((r) => r.element);
    var translates = elements.map((e) => getTranslate(e));
    var bboxes = elements.map((e) => Utils.getBBox(e));
    // test the translates
    assert.deepEqual(translates[1], [50, 0]  , "top axis translate");
    assert.deepEqual(translates[7], [50, 370], "bottom axis translate");
    assert.deepEqual(translates[3], [0, 30]  , "left axis translate");
    assert.deepEqual(translates[5], [350, 30], "right axis translate");
    assert.deepEqual(translates[4], [50, 30] , "plot translate");
    // test the bboxes
    assertBBoxEquivalence(bboxes[1], [300, 30], "top axis bbox");
    assertBBoxEquivalence(bboxes[7], [300, 30], "bottom axis bbox");
    assertBBoxEquivalence(bboxes[3], [50, 340], "left axis bbox");
    assertBBoxEquivalence(bboxes[5], [50, 340], "right axis bbox");
    assertBBoxEquivalence(bboxes[4], [300, 340], "plot bbox");
    svg.remove();
  });

  it("you can't set colMinimum or rowMinimum on tables directly", () => {
    var table = new Table();
    assert.throws(() => table.rowMinimum(3), Error, "cannot be directly set");
    assert.throws(() => table.colMinimum(3), Error, "cannot be directly set");
  });

  it("tables guess weights intelligently", () => {
    var c1 = new Component().rowWeight(0).colWeight(0);
    var c2 = new Component().rowWeight(0).colWeight(0);
    var table = new Table().addComponent(0, 0, c1).addComponent(1, 0, c2);
    assert.equal(table.rowWeight(), 0, "the first table guessed 0 for rowWeight");
    assert.equal(table.colWeight(), 0, "the first table guessed 0 for rowWeight");

    c1.rowWeight(0);
    c2.rowWeight(3);

    assert.equal(table.rowWeight(), 1, "the table now guesses 1 for rowWeight");
    assert.equal(table.colWeight(), 0, "the table still guesses 0 for colWeight");

    assert.equal(table.rowWeight(2), table, "rowWeight returned the table");
    assert.equal(table.rowWeight(), 2, "the rowWeight was overridden explicitly");
  });
});
