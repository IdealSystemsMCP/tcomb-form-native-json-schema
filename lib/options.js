/* @flow */

import { humanize } from 'tcomb-form-native/lib/util';
import StructFactory from './struct';
import stylesheet from 'tcomb-form-native/lib/stylesheets/bootstrap';
import * as templates from 'tcomb-form-native/lib/templates/bootstrap';
import moment from 'moment';
import { DATE_FORMAT} from './formats';

const datePickerTransformer = {
  format: function (value) {
    return value;
  },
  parse: function (str) {
    return str;
  }
};

// import { ImageFactory, ListFactory, StructFactory } from './Components/factories'

// https://github.com/gcanti/tcomb-form-native#rendering-options
// https://github.com/gcanti/tcomb-form-native#transformers
export default function getFormOptions(
  schema: Object,
  isRoot: boolean = true
): Object {
  let options: Object = {
    isRoot,
    stylesheet,
    templates,
    factory: StructFactory,
    label: schema.title,
    help: schema.description
  };
  const props = Object.keys(schema.properties);
  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    const required = isPropertyRequired(prop, schema);
    const propOptions = getPropertyOptions(
      schema.properties[prop],
      prop,
      required,
      stylesheet
    );
    if (!options.hasOwnProperty('fields')) {
      options.fields = {};
    }
    options.fields[prop] = propOptions;
  }
  if(schema.hasOwnProperty("order")){
    options.order = schema.order;
  }
  return options;
}

function isPropertyRequired(prop: string, schema: Object): boolean {
  return schema.required && schema.required.includes(prop);
}

function getPropertyOptions(
  property: Object,
  propName: string,
  required: boolean,
  stylesheet: Object
): Object {
  if (property.type === 'object') {
    return getFormOptions(property, false);
  }
  let options: Object = {};
  // if (property.type === 'array') {
  //   options.factory = ListFactory
  //   options.item = { label: ' ' }
  //   setPropertyOptions(options.item, property.items)
  // }
  if (property.hasOwnProperty('title')) {
    options.label = property.title;
  } else {
    options.label = humanize(propName);
  }
  if (required) {
    options.label += ' *';
  }
  if (property.hasOwnProperty('description')) {
    options.help = property.description;
  }
  if (property.hasOwnProperty('error')) {
    options.error = property.error;
  }
  setPropertyOptions(options, property,stylesheet);
  return options;
}

// const VIEW_WIDTH: number = Dimensions.get('window').width - 40 // TODO: define "40" in a stylesheet.
// const IMAGE_PICKER_OPTIONS = Object.freeze({
//   // https://github.com/react-community/react-native-image-picker#options
//   mediaType: 'photo',
//   title: I18n.t('CheckList-imagePickerTitle'),
//   cancelButtonTitle: I18n.t('CheckList-imagePickerCancelButtonTitle'),
//   takePhotoButtonTitle: I18n.t('CheckList-imagePickerTakePhotoButtonTitle'),
//   chooseFromLibraryButtonTitle: I18n.t(
//     'CheckList-imagePickerChooseFromLibraryButtonTitle'
//   )
// })
function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target, source) {
  let output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = mergeDeep(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function setPropertyOptions(options: Object, property: Object, stylesheet: Object) {
  Object.assign(options,property);
  switch (property.type) {
    case 'string':
      switch (property.format) {
        case 'textarea':
          options.multiline = true;
          if(property.hasOwnProperty("additionalStyles")) options.stylesheet = mergeDeep(stylesheet,{textbox:property.additionalStyles});
          break;
        case 'date':
          options.mode = property.format;
          options.config = {
            format: (d: Date): string =>{
              return isNaN(d.getTime())? null: moment(d).format('LL');
            }
          };
          if(typeof options.minimumDate != "undefined" && options.minimumDate != ""){
            options.minimumDate = moment(options.minimumDate, DATE_FORMAT).toDate();
          }
          if(typeof options.maximumDate != "undefined" && options.maximumDate != ""){
            options.maximumDate = moment(options.maximumDate, DATE_FORMAT).toDate();
          }
          options.transformer = datePickerTransformer;
          break;
        case 'time':
          options.mode = property.format;
          options.config = {
            format: (d: Date): string => moment(d).format('LT')
          };
          break;
        case 'date-time':
          options.mode = 'datetime';
          options.config = {
            format: (d: Date): string => moment(d).format('LLLL')
          };
          break;
        // case 'url':
        //   options.factory = ImageFactory
        //   options.config = IMAGE_PICKER_OPTIONS
        //   options.viewWidth = VIEW_WIDTH
        //   options.editable = property.options && property.options.upload
        //   break
      }
      break;
    case 'boolean':
      options.onTintColor = 'blue';
      break;
  }
}
