# TruckLoader Component

Global loader component जो truck logo के साथ animate होता है।

## Usage

```jsx
import TruckLoader from '@/components/TruckLoader';

// Basic usage
<TruckLoader />

// With custom size
<TruckLoader size="lg" />

// With custom message
<TruckLoader size="md" message="Loading data..." />

// Without message
<TruckLoader size="sm" message="" />
```

## Props

- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `message`: string (default: 'Loading...')

## Sizes

- sm: 48px (w-12 h-12)
- md: 80px (w-20 h-20)
- lg: 128px (w-32 h-32)
- xl: 160px (w-40 h-40)

## Examples

### Full Page Loading
```jsx
<div className="flex items-center justify-center h-screen">
  <TruckLoader size="lg" message="Loading..." />
</div>
```

### Inline Loading
```jsx
<div className="flex items-center justify-center py-8">
  <TruckLoader size="md" message="Please wait..." />
</div>
```

### Table Loading
```jsx
<tr>
  <td colSpan="6" className="px-6 py-12 text-center">
    <TruckLoader size="sm" message="Loading data..." />
  </td>
</tr>
```
