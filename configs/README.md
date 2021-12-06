:construction: under construction :construction:

## client-side-experiments.json

This config is used to run client side diverted experiments, adding runtime support for deploying AMP experiment configuration updates faster via the CDN and cache pages. It is complimentary to `{canary,prod,custom}-config.json` and takes precedence over them. (See I2I issue: [#34013](https://github.com/ampproject/amphtml/issues/34013))

The JSON object must contain exactly one field `experiments` which is an array of experiment definition objects with the following fields:

- `name`: experiment name
- `percentage`: percentage of AMP page views that will activate this experiment (between 0 and 1)
- `rtvPrefix`: (optional) array of RTV prefixes that will cause this experiment to be active, with period (`.`) acting as a wildcard. e.g., `["00", "0.2106"]` will cause this experiment to activate on the Experimental channel, and on every channel for the month of June, 2021 (see [Versioning section in amp-framework-hosting.md](https://github.com/ampproject/amphtml/blob/main/docs/spec/amp-framework-hosting.md#versioning) for an explanation of AMP versions and RTV numbers).

Example:

```json
{
  "experiments": [
    {
      "name": "chunked-amp",
      "percentage": 0.5
    },
    {
      "name": "version-locking",
      "percentage": 1,
      "rtvPrefix": ["01", "02", "03", "04", "05"]
    }
  ]
}
```

Once merged onto the `main` branch, this file is automatically picked up by the AMP CDN and its content is injected into `v0.[m]js`. AMP caches can also inject the contents of this file verbatim into pages inside a `<script language=text/json id=__AMP_EXP>{...}</script>` element.

## versions.json

Defines the routing between channels and RTVs (see [Versioning section in amp-framework-hosting.md](https://github.com/ampproject/amphtml/blob/main/docs/spec/amp-framework-hosting.md#versioning) for an explanation of AMP versions and RTV numbers).

Currently in testing in preparation for [#36152](https://github.com/ampproject/amphtml/issues/36152).
