ggd3
====

Just got started. Come back in a couple of weeks and we'll see how things are going.

Based on the [gg](https://github.com/gigamonkey/gg) project by gigamonkey. GGD3 takes the same approach, but is "facets first" in the way that Bootstrap is mobile first.

Grab ggd3.js and ggd3.css to use the project immediately.

Check out the examples in test.js to see it in action.

To get hacking, `git clone`, `npm install`, and `gulp install` to grab dependencies. Tests run locally and in the browser and can be viewed by opening test.html or with `gulp test`.

API
---

ggd3 exposes the global "Graphic" constructor.

```javascript
var graphic = new Graphic(data, opts);
```

Where "data" is an array of objects of name:value pairs, e.g. 

```json
[{ "country": "US", "year": "2013", "units": 10, "version": "1.2" }, 
 { "country": "US", "year": "2014", "units": 20, "version": "1.3" },
 { "country": "CA", "year": "2013", "units": 30, "version": "1.2" },
 { "country": "CA", "year": "2014", "units": 20, "version": "1.3" }]
```

And "opts" is a hash of options e.g.
```javascript
{
  graphic: {},
  facets: { flow: 'country' },
  layers: [{ geometry: 'point', mapping: { x: 'year', y: 'units', group: 'version' }],
}
```

The process of rendering a graphic happens like so:

*Setup*
* Apply options to controllers and prepare them to accept data
* Create scales (without domain or range yet)

*Apply data*
* Nest and reshape the data into a hierarchy of facets >> layers >> groups >> geometries
* Train scales and statistics on data

*Draw SVG*
* Calculate scale ranges.
* Walk down the hierarchy and assemble a SVG, not attached to the DOM.

*Render*
* Attach SVG to target element.